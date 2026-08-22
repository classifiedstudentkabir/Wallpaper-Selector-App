using CommunityToolkit.Mvvm.ComponentModel;

namespace WallpaperSelector.Core.Models;

/// <summary>Windows wallpaper fit modes (mirrors the web prototype FitMode set).</summary>
public enum FitMode
{
    Fill = 0,
    Fit = 1,
    Stretch = 2,
    Tile = 3,
    Center = 4,
    Span = 5,
}

/// <summary>Multi-monitor target for IDesktopWallpaper assignment.</summary>
public enum MonitorTarget
{
    All = 0,
    Monitor1 = 1,
    Monitor2 = 2,
}

/// <summary>
/// A single one of the six managed wallpaper slots. Observable so the UI
/// reactively updates when the active slot or missing-source state changes.
/// </summary>
public sealed partial class WallpaperSlot : ObservableObject
{
    /// <summary>Positional index 1..6. Reassigned after every reorder.</summary>
    public int SlotNumber { get; set; }

    /// <summary>UTC ticks of the moment the slot was created/imported.</summary>
    public long AddedAt { get; set; } = DateTime.UtcNow.Ticks;

    [ObservableProperty]
    private string _title = string.Empty;

    /// <summary>App-managed copy of the image (AppData Local \ WallpaperSelectorApp \ Images).</summary>
    [ObservableProperty]
    private string _filePath = string.Empty;

    /// <summary>Cached 500px thumbnail — survives deletion of the original source file.</summary>
    [ObservableProperty]
    private string _thumbnailPath = string.Empty;

    [ObservableProperty]
    private FitMode _fitMode = FitMode.Fill;

    [ObservableProperty]
    private MonitorTarget _targetMonitor = MonitorTarget.All;

    [ObservableProperty]
    private bool _isActive;

    /// <summary>
    /// Edge case flag: the source file was moved/deleted outside the app.
    /// The app falls back to the cached thumbnail and blocks apply until re-linked.
    /// </summary>
    [ObservableProperty]
    private bool _isSourceMissing;

    [ObservableProperty]
    private long _fileSizeBytes;

    [ObservableProperty]
    private ImageFilters _filters = new();
}
