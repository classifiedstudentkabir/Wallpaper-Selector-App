using System.IO;
using System.Text.Json;
using WallpaperSelector.Core.Models;

namespace WallpaperSelector.Core.Services;

public interface IStorageService
{
    string SlotsConfigPath { get; }
    string ImagesFolder { get; }

    /// <summary>Loads the six slots; heals missing/corrupt state back to defaults.</summary>
    Task<List<WallpaperSlot>> LoadSlotsAsync();
    Task SaveSlotsAsync(IEnumerable<WallpaperSlot> slots);

    /// <summary>
    /// Copies a user-selected image into the app-managed image store.
    /// Throws FileNotFoundException when the source is missing (edge case).
    /// </summary>
    Task<string> ImportImageAsync(string sourcePath, int slotNumber);

    Task ExportConfigAsync(string destinationPath);
    Task<bool> ImportConfigAsync(string sourcePath);
}

/// <summary>
/// Local AppData persistence for slot configuration, image copies and backups.
/// Mirrors the web prototype StorageService: every load performs schema healing so
/// corrupt settings can never crash startup.
/// </summary>
public sealed class StorageService : IStorageService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly string[] SupportedExtensions =
        { ".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif" };

    private readonly string _root;
    private readonly string _images;
    private readonly string _thumbnails;

    public string SlotsConfigPath { get; }
    public string ImagesFolder => _images;

    public StorageService(string? appDataRoot = null)
    {
        _root = appDataRoot ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WallpaperSelectorApp");
        _images = Path.Combine(_root, "Images");
        _thumbnails = Path.Combine(_root, "Thumbnails");
        SlotsConfigPath = Path.Combine(_root, "slots.json");

        Directory.CreateDirectory(_images);
        Directory.CreateDirectory(_thumbnails);
    }

    public Task<List<WallpaperSlot>> LoadSlotsAsync() => Task.Run(() =>
    {
        if (!File.Exists(SlotsConfigPath))
        {
            return DefaultSlots();
        }

        try
        {
            string json = File.ReadAllText(SlotsConfigPath);
            var loaded = JsonSerializer.Deserialize<List<WallpaperSlot>>(json, JsonOptions);

            // Edge case: empty or malformed slot list → heal.
            if (loaded == null || loaded.Count == 0)
            {
                return DefaultSlots();
            }

            return Normalize(loaded);
        }
        catch (Exception ex)
        {
            // Edge case: corrupted JSON → quarantine the file and recover defaults.
            System.Diagnostics.Debug.WriteLine($"[StorageService] Corrupt slots.json: {ex.Message}");
            QuarantineCorruptFile();
            return DefaultSlots();
        }
    });

    public async Task SaveSlotsAsync(IEnumerable<WallpaperSlot> slots)
    {
        List<WallpaperSlot> list = Normalize(slots.ToList());
        string json = JsonSerializer.Serialize(list, JsonOptions);
        await File.WriteAllTextAsync(SlotsConfigPath, json);
    }

    public Task<string> ImportImageAsync(string sourcePath, int slotNumber) => Task.Run(() =>
    {
        // Edge case: source deleted/moved before import.
        if (!File.Exists(sourcePath))
        {
            throw new FileNotFoundException(
                "Source image was moved or deleted. Choose the file again.", sourcePath);
        }

        string extension = Path.GetExtension(sourcePath).ToLowerInvariant();
        if (!SupportedExtensions.Contains(extension))
        {
            throw new ArgumentException($"Unsupported image format '{extension}'.");
        }

        string destination = Path.Combine(_images, $"slot{slotNumber}_{Guid.NewGuid():N}{extension}");
        File.Copy(sourcePath, destination, overwrite: true);
        return destination;
    });

    public Task ExportConfigAsync(string destinationPath) => Task.Run(() =>
    {
        var slots = File.Exists(SlotsConfigPath)
            ? JsonSerializer.Deserialize<List<WallpaperSlot>>(File.ReadAllText(SlotsConfigPath), JsonOptions)
              ?? DefaultSlots()
            : DefaultSlots();

        var bundle = new SlotExportBundle
        {
            Version = "1.2.0",
            ExportedAt = DateTime.UtcNow.ToString("o"),
            Slots = slots,
        };

        File.WriteAllText(destinationPath, JsonSerializer.Serialize(bundle, JsonOptions));
    });

    public Task<bool> ImportConfigAsync(string sourcePath) => Task.Run(() =>
    {
        try
        {
            var bundle = JsonSerializer.Deserialize<SlotExportBundle>(File.ReadAllText(sourcePath), JsonOptions);
            if (bundle?.Slots == null || bundle.Slots.Count == 0) return false;

            string json = JsonSerializer.Serialize(Normalize(bundle.Slots), JsonOptions);
            File.WriteAllText(SlotsConfigPath, json);
            return true;
        }
        catch
        {
            return false;
        }
    });

    #region Helpers

    /// <summary>Factory for a fresh 1..6 slot set.</summary>
    public static List<WallpaperSlot> DefaultSlots() =>
        Enumerable.Range(1, 6)
            .Select(n => new WallpaperSlot
            {
                SlotNumber = n,
                Title = $"Slot {n}",
            })
            .ToList();

    /// <summary>
    /// Guarantees the invariant: exactly six slots numbered strictly 1..6 with no
    /// duplicates — the same integrity rule the web prototype ReorderSlots enforces.
    /// </summary>
    public static List<WallpaperSlot> Normalize(List<WallpaperSlot> slots)
    {
        var result = new List<WallpaperSlot>();
        var seen = new HashSet<WallpaperSlot>(ReferenceEqualityComparer.Instance);

        foreach (WallpaperSlot candidate in slots)
        {
            if (result.Count >= 6) break;
            if (!seen.Add(candidate)) continue; // duplicate reference guard
            candidate.Filters ??= new ImageFilters();
            result.Add(candidate);
        }

        while (result.Count < 6)
        {
            result.Add(new WallpaperSlot
            {
                SlotNumber = result.Count + 1,
                Title = $"Slot {result.Count + 1}",
            });
        }

        for (int i = 0; i < result.Count; i++)
        {
            result[i].SlotNumber = i + 1;
        }

        return result;
    }

    private void QuarantineCorruptFile()
    {
        try
        {
            File.Copy(SlotsConfigPath, SlotsConfigPath + $".corrupt-{DateTime.Now:yyyyMMddHHmmss}");
        }
        catch
        {
            // Best effort — never block startup on diagnostics.
        }
    }

    private sealed record SlotExportBundle
    {
        public string Version { get; init; } = "";
        public string ExportedAt { get; init; } = "";
        public List<WallpaperSlot> Slots { get; init; } = new();
    }

    #endregion
}
