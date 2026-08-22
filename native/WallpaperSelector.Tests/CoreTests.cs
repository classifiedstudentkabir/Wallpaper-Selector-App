using System.Drawing;
using System.IO;
using WallpaperSelector.Core.Models;
using WallpaperSelector.Core.Services;
using WallpaperSelector.Core.ViewModels;
using Xunit;

namespace WallpaperSelector.Tests;

/// <summary>StorageService: schema healing, corrupted JSON, 1..6 invariant, imports.</summary>
public sealed class StorageServiceTests : IDisposable
{
    private readonly string _tempRoot;
    private readonly StorageService _service;

    public StorageServiceTests()
    {
        _tempRoot = Directory.CreateTempSubdirectory("ws-test-").FullName;
        _service = new StorageService(_tempRoot);
    }

    public void Dispose()
    {
        try
        {
            Directory.Delete(_tempRoot, recursive: true);
        }
        catch
        {
            // temp cleanup is best effort
        }
    }

    [Fact]
    public async Task LoadSlots_WhenNoFile_ReturnsSixDefaults()
    {
        List<WallpaperSlot> slots = await _service.LoadSlotsAsync();

        Assert.Equal(6, slots.Count);
        for (int i = 1; i <= 6; i++)
        {
            Assert.Equal(i, slots[i - 1].SlotNumber);
        }
    }

    [Fact]
    public async Task LoadSlots_WithCorruptJson_RecoversToDefaults()
    {
        // Edge case: corrupted settings (handoff requirement).
        File.WriteAllText(_service.SlotsConfigPath, "{ this is : not valid json !!!");

        List<WallpaperSlot> slots = await _service.LoadSlotsAsync();

        Assert.Equal(6, slots.Count);
        Assert.Equal(1, slots[0].SlotNumber);
    }

    [Fact]
    public async Task SaveThenLoad_Roundtrip_PreservesTitlesAndOrder()
    {
        var slots = await _service.LoadSlotsAsync();
        slots[0].Title = "Slot One Custom";
        slots[3].Title = "Slot Four Custom";
        slots[0].IsActive = true;
        await _service.SaveSlotsAsync(slots);

        List<WallpaperSlot> reloaded = await _service.LoadSlotsAsync();

        Assert.Equal("Slot One Custom", reloaded[0].Title);
        Assert.Equal("Slot Four Custom", reloaded[3].Title);
        Assert.True(reloaded[0].IsActive);
    }

    [Fact]
    public async Task Normalize_DuplicateSlotNumbers_ReindexesToStrict1To6()
    {
        var broken = new List<WallpaperSlot>
        {
            new() { SlotNumber = 1, Title = "A" },
            new() { SlotNumber = 1, Title = "B" }, // duplicate
            new() { SlotNumber = 2, Title = "C" },
            new() { SlotNumber = 5, Title = "D" },
            new() { SlotNumber = 9, Title = "E" },
        };
        await _service.SaveSlotsAsync(broken);

        List<WallpaperSlot> reloaded = await _service.LoadSlotsAsync();

        var numbers = reloaded.Select(s => s.SlotNumber).ToList();
        Assert.Equal(new[] { 1, 2, 3, 4, 5, 6 }, numbers);
    }

    [Fact]
    public async Task ImportImage_WhenSourceDeleted_ThrowsFileNotFound()
    {
        // Edge case: deleted source file (handoff requirement).
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            _service.ImportImageAsync(Path.Combine(_tempRoot, "ghost.png"), 1));
    }

    [Fact]
    public async Task ImportImage_CopiesFileIntoAppImageStore()
    {
        string source = Path.Combine(_tempRoot, "source.png");
        using (var bmp = new Bitmap(32, 32))
        {
            bmp.Save(source, System.Drawing.Imaging.ImageFormat.Png);
        }

        string imported = await _service.ImportImageAsync(source, 2);

        Assert.True(File.Exists(imported));
        Assert.StartsWith(_service.ImagesFolder, imported);
        Assert.StartsWith("slot2_", Path.GetFileName(imported));
    }
}

/// <summary>MainViewModel: apply, reorder integrity, clear, add.</summary>
public sealed class MainViewModelTests
{
    private sealed class FakeWallpaperService : IWallpaperService
    {
        public int ApplyCalls;
        public Task<bool> SetWallpaperAsync(string imagePath, FitMode fitMode, MonitorTarget target = MonitorTarget.All)
        {
            ApplyCalls++;
            return Task.FromResult(true);
        }
    }

    private static async Task<(MainViewModel vm, FakeWallpaperService fake)> CreateVmAsync()
    {
        string temp = Directory.CreateTempSubdirectory("ws-vm-test-").FullName;
        var storage = new StorageService(temp);
        var fake = new FakeWallpaperService();
        var vm = new MainViewModel(storage, fake);
        await vm.InitializeAsync();
        return (vm, fake);
    }

    [Fact]
    public async Task ApplyWallpaper_SetsExactlyOneActiveSlot()
    {
        (MainViewModel vm, FakeWallpaperService fake) = await CreateVmAsync();

        vm.Slots[2].FilePath = Path.GetTempFileName();
        await vm.ApplyWallpaperAsync(vm.Slots[2]);

        Assert.Equal(1, vm.Slots.Count(s => s.IsActive));
        Assert.True(vm.Slots[2].IsActive);
        Assert.Same(vm.Slots[2], vm.ActiveSlot);
        Assert.Equal(1, fake.ApplyCalls);
    }

    [Fact]
    public async Task ApplyWallpaper_WithMissingSource_DoesNotCallService()
    {
        (MainViewModel vm, FakeWallpaperService fake) = await CreateVmAsync();
        vm.Slots[1].FilePath = "/definitely/not/a/real/path.png";

        await vm.ApplyWallpaperAsync(vm.Slots[1]);

        Assert.Equal(0, fake.ApplyCalls);
        Assert.True(vm.Slots[1].IsSourceMissing);
    }

    [Fact]
    public async Task ReorderSlots_AlwaysPreservesStrict1To6Sequence()
    {
        (MainViewModel vm, _) = await CreateVmAsync();

        vm.ReorderSlots(0, 4);
        Assert.Equal(new[] { 1, 2, 3, 4, 5, 6 }, vm.Slots.Select(s => s.SlotNumber).ToArray());

        vm.ReorderSlots(5, 0);
        Assert.Equal(new[] { 1, 2, 3, 4, 5, 6 }, vm.Slots.Select(s => s.SlotNumber).ToArray());
    }

    [Fact]
    public async Task ReorderSlots_IgnoresOutOfBoundsIndices()
    {
        (MainViewModel vm, _) = await CreateVmAsync();
        WallpaperSlot first = vm.Slots[0];

        vm.ReorderSlots(0, 99);
        vm.ReorderSlots(-1, 2);

        Assert.Same(first, vm.Slots[0]);
    }

    [Fact]
    public async Task ClearSlot_EmptiesPathAndDeselects()
    {
        (MainViewModel vm, _) = await CreateVmAsync();
        vm.Slots[0].FilePath = "/tmp/x.png";
        vm.Slots[0].IsActive = true;

        await vm.ClearSlotAsync(vm.Slots[0]);

        Assert.Equal(string.Empty, vm.Slots[0].FilePath);
        Assert.False(vm.Slots[0].IsActive);
    }

    [Fact]
    public async Task VerifySources_FlagsMissingFiles()
    {
        (MainViewModel vm, _) = await CreateVmAsync();
        vm.Slots[0].FilePath = "/vanished/file.png";
        string real = Path.GetTempFileName();
        vm.Slots[1].FilePath = real;

        vm.VerifySources();

        Assert.True(vm.Slots[0].IsSourceMissing);
        Assert.False(vm.Slots[1].IsSourceMissing);
        File.Delete(real);
    }
}

/// <summary>WallpaperService: fit-mode registry mapping and missing-file guard.</summary>
public sealed class WallpaperServiceTests
{
    [Theory]
    [InlineData(FitMode.Fill, "10", "0")]
    [InlineData(FitMode.Fit, "6", "0")]
    [InlineData(FitMode.Stretch, "2", "0")]
    [InlineData(FitMode.Center, "0", "0")]
    [InlineData(FitMode.Tile, "0", "1")]
    [InlineData(FitMode.Span, "22", "0")]
    public void FitMode_MapsToExpectedRegistryValues(FitMode fit, string style, string tile)
    {
        var (wallpaperStyle, tileWallpaper) = WallpaperService.FitModeToRegistryValues(fit);
        Assert.Equal(style, wallpaperStyle);
        Assert.Equal(tile, tileWallpaper);
    }

    [Fact]
    public async Task SetWallpaper_MissingFile_ReturnsFalseWithoutCrash()
    {
        var service = new WallpaperService();

        bool ok = await service.SetWallpaperAsync("/no/such/wallpaper.jpg", FitMode.Fill);

        Assert.False(ok);
    }
}
