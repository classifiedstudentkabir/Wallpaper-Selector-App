using Microsoft.UI.Xaml;
using WallpaperSelector.Core.Services;
using WallpaperSelector.Core.ViewModels;

namespace WallpaperSelector;

/// <summary>A single registered global hotkey (kept here so HotkeysPage can re-register).</summary>
public record HotkeyBindingSpec(int Id, uint Modifiers, uint VirtualKey, string Display, Action Action);

/// <summary>
/// WinUI 3 Application root. Acts as the composition root: all services and
/// view models are created once and shared via static accessors (simple,
/// dependency-injection-light wiring for a single-window utility).
/// </summary>
public partial class App : Application
{
    public static StorageService Storage { get; } = new();
    public static WallpaperService Wallpaper { get; } = new();
    public static ThumbnailService Thumbnails { get; } = new();
    public static SettingsService Settings { get; } = new();
    public static HotkeyService Hotkeys { get; } = new();

    public static MainViewModel MainVM { get; } = new(Storage, Wallpaper, Thumbnails);
    public static SettingsViewModel SettingsVM { get; } = new(Settings, Thumbnails);
    public static AutoRotateViewModel RotateVM { get; } = new(MainVM, Settings);

    /// <summary>Declared in MainWindow; re-registered from the Hotkeys page.</summary>
    public static List<HotkeyBindingSpec> HotkeyBindings { get; } = new();

    private Window? _window;

    public Window? MainWindow => _window;

    public App()
    {
        this.InitializeComponent();
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        _window = new MainWindow();
        await MainVM.InitializeAsync();
        _window.Activate();
    }
}
