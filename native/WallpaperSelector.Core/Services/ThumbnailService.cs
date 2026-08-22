using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

namespace WallpaperSelector.Core.Services;

/// <summary>
/// Downsamples imported images into 500px PNG thumbnails stored under
/// AppData Local \ WallpaperSelectorApp \ Thumbnails.
///
/// Thumbnails are intentionally independent of the source file so that a
/// deleted/moved source still renders in slot cards and the Quick Switcher HUD
/// (the "deleted source file" edge case from the handoff).
/// </summary>
public sealed class ThumbnailService
{
    private readonly string _thumbnailDir;

    public string ThumbnailDirectory => _thumbnailDir;

    public ThumbnailService(string? appDataRoot = null)
    {
        string root = appDataRoot ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WallpaperSelectorApp");
        _thumbnailDir = Path.Combine(root, "Thumbnails");
        Directory.CreateDirectory(_thumbnailDir);
    }

    public string CreateThumbnail(string sourcePath, int slotNumber, int maxDimension = 500)
    {
        if (!File.Exists(sourcePath))
        {
            throw new FileNotFoundException(
                "Cannot create thumbnail — source image is missing.", sourcePath);
        }

        // Load via MemoryStream to avoid file locks on the imported image.
        byte[] bytes = File.ReadAllBytes(sourcePath);
        using var stream = new MemoryStream(bytes);
        using var original = Image.FromStream(stream, useEmbeddedColorManagement: true, validateImageData: false);

        double scale = Math.Min(1.0, maxDimension / (double)Math.Max(original.Width, original.Height));
        int width = Math.Max(1, (int)(original.Width * scale));
        int height = Math.Max(1, (int)(original.Height * scale));

        using var thumbnail = new Bitmap(width, height);
        using (var graphics = Graphics.FromImage(thumbnail))
        {
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            graphics.DrawImage(original, 0, 0, width, height);
        }

        string destination = Path.Combine(_thumbnailDir, $"thumb-slot{slotNumber}.png");
        thumbnail.Save(destination, ImageFormat.Png);
        return destination;
    }

    public void ClearCache()
    {
        foreach (string file in Directory.EnumerateFiles(_thumbnailDir))
        {
            try
            {
                File.Delete(file);
            }
            catch
            {
                // File may be locked by the running UI — skip.
            }
        }
    }
}
