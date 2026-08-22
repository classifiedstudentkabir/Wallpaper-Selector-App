using Microsoft.UI.Xaml.Controls;

namespace WallpaperSelector.Views;

public sealed partial class AboutPage : Page
{
    public AboutPage()
    {
        this.InitializeComponent();

        // The features ItemsControl is populated from code to keep a single source of truth.
        // (Find it via the page root — the ItemsControl is the only one on this page.)
        var features = new[]
        {
            "WinUI 3 shell with custom Mica title bar and NavigationView (Home, Hotkeys, Auto-Rotate, Settings, About)",
            "6-slot grid dashboard with active-slot tracking and instant apply",
            "Global hotkeys: Win+Alt+W picker, Win+Alt+1..6 direct apply, Win+Alt+Left/Right cycle",
            "Drag-and-drop slot reordering with strict 1..6 re-indexing (plus button fallback)",
            "WallpaperService: SystemParametersInfo + IDesktopWallpaper per-monitor COM + fit-mode registry",
            "StorageService: AppData slot persistence, image copies, cached thumbnails",
            "Edge cases: deleted source files (cached thumbnail fallback), corrupted settings JSON auto-repair",
            "Auto-rotate scheduler with intervals and shuffle mode, persisted to autorotate.json",
            "xUnit test suite in WallpaperSelector.Tests validating the handoff edge cases",
        };

        // Locate the ItemsControl under the "Implemented Features" header.
        this.FindFeaturesControl()?.ItemsSource = features;
    }

    private ItemsControl? FindFeaturesControl()
    {
        Queue<DependencyObject> queue = new();
        queue.Enqueue(this);

        while (queue.Count > 0)
        {
            DependencyObject current = queue.Dequeue();
            int count = Microsoft.UI.Xaml.Media.VisualTreeHelper.GetChildrenCount(current);

            for (int i = 0; i < count; i++)
            {
                DependencyObject child = Microsoft.UI.Xaml.Media.VisualTreeHelper.GetChild(current, i);
                if (child is ItemsControl itemsControl) return itemsControl;
                queue.Enqueue(child);
            }
        }

        return null;
    }
}
