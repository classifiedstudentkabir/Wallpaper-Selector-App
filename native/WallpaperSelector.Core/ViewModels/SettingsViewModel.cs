using System.IO;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using WallpaperSelector.Core.Models;
using WallpaperSelector.Core.Services;

namespace WallpaperSelector.Core.ViewModels;

public sealed partial class SettingsViewModel : ObservableObject
{
    private readonly SettingsService _settings;
    private readonly ThumbnailService _thumbnails;

    [ObservableProperty]
    private AppSettingsModel _current;

    [ObservableProperty]
    private string _statusMessage = "Settings loaded.";

    public string CachePath => Path.Combine(_settings.RootFolder, "Thumbnails");
    public string DataPath => _settings.RootFolder;

    public SettingsViewModel(SettingsService settings, ThumbnailService? thumbnails = null)
    {
        _settings = settings;
        _thumbnails = thumbnails ?? new ThumbnailService(settings.RootFolder);
        Current = _settings.LoadSettings();
    }

    [RelayCommand]
    public void Save()
    {
        _settings.SaveSettings(Current);
        StatusMessage = $"Saved. Startup run key: {(Current.StartWithWindows ? "enabled" : "disabled")}.";
    }

    [RelayCommand]
    public void ClearThumbnailCache()
    {
        _thumbnails.ClearCache();
        StatusMessage = "Thumbnail cache cleared.";
    }

    [RelayCommand]
    public void ExportSettings()
    {
        try
        {
            string destination = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                $"wallpaper-selector-settings-{DateTime.Now:yyyyMMdd-HHmm}.json");

            _settings.SaveSettings(Current);
            StatusMessage = $"Settings exported to {destination}.";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Export failed: {ex.Message}";
        }
    }
}
