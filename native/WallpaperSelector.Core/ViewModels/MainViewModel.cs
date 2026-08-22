using System.Collections.ObjectModel;
using System.IO;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using WallpaperSelector.Core.Models;
using WallpaperSelector.Core.Services;

namespace WallpaperSelector.Core.ViewModels;

/// <summary>
/// MVVM core for the six wallpaper slots — mirrors the web prototype
/// MainViewModel: apply, add, clear, reorder (1..6 integrity), cycle,
/// export/import and source-missing verification.
/// </summary>
public sealed partial class MainViewModel : ObservableObject
{
    private readonly IStorageService _storage;
    private readonly IWallpaperService _wallpaper;
    private readonly ThumbnailService _thumbnails;

    [ObservableProperty]
    private ObservableCollection<WallpaperSlot> _slots = new();

    [ObservableProperty]
    private WallpaperSlot? _activeSlot;

    [ObservableProperty]
    private string _statusMessage = "Ready.";

    [ObservableProperty]
    private bool _isLoading;

    public MainViewModel(IStorageService storage, IWallpaperService wallpaper, ThumbnailService? thumbnails = null)
    {
        _storage = storage;
        _wallpaper = wallpaper;
        _thumbnails = thumbnails ?? new ThumbnailService(storage is StorageService s ? Path.GetDirectoryName(s.ImagesFolder) : null);
    }

    [RelayCommand]
    public async Task InitializeAsync()
    {
        IsLoading = true;
        try
        {
            Slots = new ObservableCollection<WallpaperSlot>(await _storage.LoadSlotsAsync());
            VerifySources();

            ActiveSlot = Slots.FirstOrDefault(s => s.IsActive) ?? Slots.FirstOrDefault();
            if (ActiveSlot != null) ActiveSlot.IsActive = true;

            StatusMessage = $"Loaded {Slots.Count} slots. Active: Slot {ActiveSlot?.SlotNumber.ToString() ?? "—"}.";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    public async Task ApplyWallpaperAsync(WallpaperSlot? slot)
    {
        if (slot == null) return;

        // Edge case: source file deleted/moved → refuse and surface the warning.
        if (string.IsNullOrEmpty(slot.FilePath) || !File.Exists(slot.FilePath))
        {
            slot.IsSourceMissing = true;
            StatusMessage = $"Slot {slot.SlotNumber}: source image is missing. Re-import the image to apply.";
            return;
        }

        foreach (WallpaperSlot s in Slots) s.IsActive = ReferenceEquals(s, slot);
        ActiveSlot = slot;

        bool ok = await _wallpaper.SetWallpaperAsync(slot.FilePath, slot.FitMode, slot.TargetMonitor);
        StatusMessage = ok
            ? $"Applied Slot {slot.SlotNumber}: {slot.Title}"
            : $"WallpaperService failed to apply Slot {slot.SlotNumber}.";

        await _storage.SaveSlotsAsync(Slots);
    }

    [RelayCommand]
    public Task AddWallpaperAsync(string? filePath) => AddWallpaperAsync(filePath, preferredSlot: null);

    public async Task AddWallpaperAsync(string? filePath, int? preferredSlot)
    {
        if (string.IsNullOrWhiteSpace(filePath)) return;

        int target = preferredSlot
                    ?? Slots.FirstOrDefault(s => string.IsNullOrEmpty(s.FilePath))?.SlotNumber
                    ?? 1;

        try
        {
            string imported = await _storage.ImportImageAsync(filePath, target);
            WallpaperSlot? slot = Slots.FirstOrDefault(s => s.SlotNumber == target) ?? Slots[0];

            slot.FilePath = imported;
            slot.Title = Path.GetFileNameWithoutExtension(filePath);
            slot.FileSizeBytes = new FileInfo(imported).Length;
            slot.IsSourceMissing = false;

            try
            {
                slot.ThumbnailPath = _thumbnails.CreateThumbnail(imported, slot.SlotNumber);
            }
            catch
            {
                // Thumbnail generation is best effort — fall back to the full image.
                slot.ThumbnailPath = imported;
            }

            StatusMessage = $"Added '{slot.Title}' to Slot {slot.SlotNumber}.";
            await _storage.SaveSlotsAsync(Slots);
        }
        catch (Exception ex)
        {
            StatusMessage = $"Import failed: {ex.Message}";
        }
    }

    [RelayCommand]
    public async Task ClearSlotAsync(WallpaperSlot? slot)
    {
        if (slot == null) return;

        slot.Title = $"Slot {slot.SlotNumber}";
        slot.FilePath = string.Empty;
        slot.ThumbnailPath = string.Empty;
        slot.IsActive = false;
        slot.IsSourceMissing = false;
        slot.FileSizeBytes = 0;

        ActiveSlot = Slots.FirstOrDefault(s => s.IsActive);
        StatusMessage = $"Cleared Slot {slot.SlotNumber}.";
        await _storage.SaveSlotsAsync(Slots);
    }

    /// <summary>
    /// Drag-and-drop / button reorder. Enforces the strict 1..6 re-indexing
    /// invariant that the diagnostics suite validates.
    /// </summary>
    public void ReorderSlots(int oldIndex, int newIndex)
    {
        if (oldIndex < 0 || newIndex < 0 || oldIndex >= Slots.Count ||
            newIndex >= Slots.Count || oldIndex == newIndex)
        {
            return;
        }

        Slots.Move(oldIndex, newIndex);
        for (int i = 0; i < Slots.Count; i++)
        {
            Slots[i].SlotNumber = i + 1;
        }

        _ = _storage.SaveSlotsAsync(Slots);
        StatusMessage = $"Reordered: moved slot to position {newIndex + 1}.";
    }

    [RelayCommand]
    public void MoveSlotUp(WallpaperSlot? slot)
    {
        int index = IndexOf(slot);
        if (index > 0) ReorderSlots(index, index - 1);
    }

    [RelayCommand]
    public void MoveSlotDown(WallpaperSlot? slot)
    {
        int index = IndexOf(slot);
        if (index >= 0 && index < Slots.Count - 1) ReorderSlots(index, index + 1);
    }

    /// <summary>Win + Alt + Right / Left cycling.</summary>
    [RelayCommand]
    public async Task CycleAsync(bool forward)
    {
        int current = IndexOf(ActiveSlot);
        int next = current + (forward ? 1 : -1);
        next = ((next % Slots.Count) + Slots.Count) % Slots.Count;
        await ApplyWallpaperAsync(Slots[next]);
    }

    [RelayCommand]
    public async Task ExportConfigAsync(string? destinationPath)
    {
        if (string.IsNullOrWhiteSpace(destinationPath)) return;
        await _storage.ExportConfigAsync(destinationPath);
        StatusMessage = $"Configuration exported to {Path.GetFileName(destinationPath)}.";
    }

    [RelayCommand]
    public async Task ImportConfigAsync(string? sourcePath)
    {
        if (string.IsNullOrWhiteSpace(sourcePath)) return;
        bool ok = await _storage.ImportConfigAsync(sourcePath);
        if (ok)
        {
            await InitializeAsync();
            StatusMessage = "Configuration imported successfully.";
        }
        else
        {
            StatusMessage = "Import failed: the file is not a valid Wallpaper Selector export.";
        }
    }

    /// <summary>Flags every slot whose source file disappeared from disk.</summary>
    public void VerifySources()
    {
        foreach (WallpaperSlot slot in Slots)
        {
            slot.IsSourceMissing = !string.IsNullOrEmpty(slot.FilePath) && !File.Exists(slot.FilePath);
        }
    }

    public int IndexOf(WallpaperSlot? slot) =>
        slot == null ? -1 : Slots.ToList().IndexOf(slot);

    private static int IndexOfSlot(ObservableCollection<WallpaperSlot> slots, WallpaperSlot? slot) =>
        slot == null ? -1 : slots.ToList().IndexOf(slot);
}
