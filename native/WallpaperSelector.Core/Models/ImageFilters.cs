namespace WallpaperSelector.Core.Models;

/// <summary>
/// Per-slot preview adjustments. Persisted with the slot configuration and
/// applied to in-app previews (slot cards + quick switcher HUD).
/// Windows itself renders the raw wallpaper; the filter set is metadata for
/// the selector UI and the live desktop simulator reference.
/// </summary>
public sealed class ImageFilters
{
    public int Brightness { get; set; } = 100;
    public int Contrast { get; set; } = 100;
    public int Saturation { get; set; } = 100;
    public int Blur { get; set; } = 0;
    public int HueRotate { get; set; } = 0;
    public int Grayscale { get; set; } = 0;
    public int Sepia { get; set; } = 0;
    public int Vignette { get; set; } = 0;

    public bool IsDefault =>
        Brightness == 100 &&
        Contrast == 100 &&
        Saturation == 100 &&
        Blur == 0 &&
        HueRotate == 0 &&
        Grayscale == 0 &&
        Sepia == 0 &&
        Vignette == 0;

    public override string ToString() =>
        IsDefault ? "none" :
        $"brightness({Brightness}%) contrast({Contrast}%) saturate({Saturation}%)";
}
