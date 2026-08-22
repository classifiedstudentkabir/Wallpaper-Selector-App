namespace WallpaperSelector;

/// <summary>
/// Unpackaged WinUI 3 entry point. Launches the XAML Application,
/// whose OnLaunched constructs MainWindow and wires the global hotkeys.
/// </summary>
static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        Microsoft.UI.Xaml.Application.Start((_) =>
        {
            _ = new App();
        });
    }
}
