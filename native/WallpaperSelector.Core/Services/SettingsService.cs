using System.IO;
using System.Text.Json;
using Microsoft.Win32;
using WallpaperSelector.Core.Models;

namespace WallpaperSelector.Core.Services;

/// <summary>
/// Persists settings.json / hotkeys.json / autorotate.json under
/// AppData Local \ WallpaperSelectorApp and manages the "Run at startup"
/// registry key. Every load falls back to defaults when data is missing
/// or corrupt, mirroring the web prototype SettingsService.
/// </summary>
public sealed class SettingsService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private const string RunKey = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    private const string RunValueName = "WallpaperSelector";

    private readonly string _root;

    public string RootFolder => _root;

    public SettingsService(string? appDataRoot = null)
    {
        _root = appDataRoot ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WallpaperSelectorApp");
        Directory.CreateDirectory(_root);
    }

    private string PathFor(string fileName) => Path.Combine(_root, fileName);

    #region Settings

    public AppSettingsModel LoadSettings() =>
        TryLoad(AppSettingsPath, () => new AppSettingsModel());

    public void SaveSettings(AppSettingsModel settings)
    {
        File.WriteAllText(AppSettingsPath, JsonSerializer.Serialize(settings, JsonOptions));
        SetStartWithWindows(settings.StartWithWindows);
    }

    private string AppSettingsPath => PathFor("settings.json");

    #endregion

    #region Hotkeys

    public HotkeyConfigModel LoadHotkeys() =>
        TryLoad(HotkeysPath, () => new HotkeyConfigModel());

    public void SaveHotkeys(HotkeyConfigModel hotkeys)
    {
        File.WriteAllText(HotkeysPath, JsonSerializer.Serialize(hotkeys, JsonOptions));
    }

    private string HotkeysPath => PathFor("hotkeys.json");

    #endregion

    #region Auto-Rotate

    public AutoRotateConfigModel LoadAutoRotate() =>
        TryLoad(AutoRotatePath, () => new AutoRotateConfigModel());

    public void SaveAutoRotate(AutoRotateConfigModel config)
    {
        File.WriteAllText(AutoRotatePath, JsonSerializer.Serialize(config, JsonOptions));
    }

    private string AutoRotatePath => PathFor("autorotate.json");

    #endregion

    #region Startup

    /// <summary>Writes/removes the HKCU Run key so the app launches with Windows.</summary>
    public void SetStartWithWindows(bool enabled)
    {
        try
        {
            using RegistryKey? run = Registry.CurrentUser.OpenSubKey(RunKey, writable: true);
            if (run == null) return;

            if (enabled)
            {
                string exe = Environment.ProcessPath
                              ?? System.Diagnostics.Process.GetCurrentProcess().MainModule?.FileName
                              ?? "";
                if (!string.IsNullOrEmpty(exe))
                {
                    run.SetValue(RunValueName, $"\"{exe}\"", RegistryValueKind.String);
                }
            }
            else
            {
                run.DeleteValue(RunValueName, throwOnMissingValue: false);
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[SettingsService] Run key update failed: {ex.Message}");
        }
    }

    #endregion

    private T TryLoad<T>(string path, Func<T> fallback) where T : class
    {
        try
        {
            if (!File.Exists(path)) return fallback();
            return JsonSerializer.Deserialize<T>(File.ReadAllText(path), JsonOptions) ?? fallback();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[SettingsService] Recovered from corrupt {path}: {ex.Message}");
            return fallback();
        }
    }
}
