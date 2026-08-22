using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32;
using WallpaperSelector.Core.Models;

namespace WallpaperSelector.Core.Services;

public interface IWallpaperService
{
    Task<bool> SetWallpaperAsync(string imagePath, FitMode fitMode, MonitorTarget target = MonitorTarget.All);
}

/// <summary>
/// Applies images as the Windows desktop background using
/// Win32 SystemParametersInfo (all monitors) and the
/// IDesktopWallpaper COM API (per-monitor, Win10 1607+).
/// Fit modes are written to the Control Panel\Desktop registry keys,
/// matching how the Windows 11 settings app stores them.
/// </summary>
public sealed class WallpaperService : IWallpaperService
{
    private const int SPI_SETDESKWALLPAPER = 0x0014;
    private const int SPIF_UPDATEINIFILE = 0x01;
    private const int SPIF_SENDCHANGE = 0x02;

    /// <summary>
    /// Exposed as a pure function so the fit-mode → registry mapping is unit-testable
    /// without touching the live Windows desktop.
    /// </summary>
    public static (string WallpaperStyle, string TileWallpaper) FitModeToRegistryValues(FitMode fit) => fit switch
    {
        FitMode.Fill => ("10", "0"),
        FitMode.Fit => ("6", "0"),
        FitMode.Stretch => ("2", "0"),
        FitMode.Center => ("0", "0"),
        FitMode.Tile => ("0", "1"),
        FitMode.Span => ("22", "0"),
        _ => ("10", "0"),
    };

    public async Task<bool> SetWallpaperAsync(string imagePath, FitMode fitMode, MonitorTarget target = MonitorTarget.All)
    {
        return await Task.Run(() =>
        {
            // Edge case: source file deleted/moved → fail cleanly, UI surfaces the warning.
            if (string.IsNullOrWhiteSpace(imagePath) || !File.Exists(imagePath))
            {
                return false;
            }

            ApplyFitMode(fitMode);

            try
            {
                return target == MonitorTarget.All
                    ? ApplyToAllMonitors(imagePath)
                    : ApplyToSingleMonitor(imagePath, target);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[WallpaperService] Apply failed: {ex.Message}");
                return false;
            }
        });
    }

    private static void ApplyFitMode(FitMode fit)
    {
        var (style, tile) = FitModeToRegistryValues(fit);
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop", writable: true);
            key?.SetValue("WallpaperStyle", style, RegistryValueKind.String);
            key?.SetValue("TileWallpaper", tile, RegistryValueKind.String);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[WallpaperService] Fit registry write failed: {ex.Message}");
        }
    }

    private static bool ApplyToAllMonitors(string imagePath)
    {
        int result = Win32.SystemParametersInfo(
            SPI_SETDESKWALLPAPER, 0, imagePath, SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);
        return result == 0;
    }

    private static bool ApplyToSingleMonitor(string imagePath, MonitorTarget target)
    {
        // IDesktopWallpaper COM — CLSID {C6D72173-9ACB-4A75-9984-E46C5021FCBB}
        Type? coclass = Type.GetTypeFromCLSID(new Guid("C6D72173-9ACB-4A75-9984-E46C5021FCBB"));
        if (coclass == null) return false;

        var wallpaper = (IDesktopWallpaper)Activator.CreateInstance(coclass)!;
        int monitorIndex = target == MonitorTarget.Monitor1 ? 0 : 1;

        wallpaper.SetWallpaper(monitorIndex, imagePath);
        wallpaper.ForceRefresh();
        return true;
    }

    #region Win32 / COM interop

    private static class Win32
    {
        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public enum VIRTUAL_DESKTOP_MODIFICATION_TYPE
    {
        VIRTUAL_DESKTOP_MODIFICATION_TYPE_SameDesktop = 0,
        VIRTUAL_DESKTOP_MODIFICATION_TYPE_MoveToCurrentDesktop = 1,
        VIRTUAL_DESKTOP_MODIFICATION_TYPE_MoveToDesktop = 2,
        VIRTUAL_DESKTOP_MODIFICATION_TYPE_SetDesktop = 3,
    }

    [ComImport, Guid("A5CD92FF-29BE-454C-8D04-D82879FB3F1B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IVirtualDesktopManagerVirtualDesktop
    {
        void IsWindowOnVirtualDesktop(IntPtr dwId, [MarshalAs(UnmanagedType.Bool)] out bool pfResult);
        void GetWindowDesktopId(IntPtr dwId, out Guid id);
        void MoveWindowToDesktopId(IntPtr dwId, ref Guid id);
    }

    [ComImport, Guid("BFEAA513-ED7B-40F5-8AA6-A5CD38090C13"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IDesktopWallpaper
    {
        void SetWallpaper(int monitorIndex, [MarshalAs(UnmanagedType.LPWStr)] string lpszWallpaper);
        void ConfigureVirtualDesktop(IVirtualDesktopManagerVirtualDesktop virtualDesktop_id, VIRTUAL_DESKTOP_MODIFICATION_TYPE eModFlags);
        void SetBackgroundColor(uint clrBackground);
        void SetSlideshowDuration(ref uint puiDuration);
        void SetMotionEnabled([MarshalAs(UnmanagedType.Bool)] bool fMotionEnabled);
        [return: MarshalAs(UnmanagedType.Bool)] bool GetIsMotionEnabled();
        void SetSlideInterval(ref uint puiDuration);
        void ForceRefresh();
        void EnableSlideShow([MarshalAs(UnmanagedType.Bool)] bool fEnabled);
        void SetPosition(int monitorIndex, ref RECT pVirtualDesktopSubrect);
        void GetPosition(int monitorIndex, ref RECT pVirtualDesktopSubrect);
    }

    #endregion
}
