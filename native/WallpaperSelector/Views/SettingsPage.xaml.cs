using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using WallpaperSelector.Core.Models;

namespace WallpaperSelector.Views;

public sealed partial class SettingsPage : Page
{
    private static readonly string[] AccentHexes =
        { "#0078D4", "#60CDFF", "#9B51E0", "#107C41", "#FF8C00", "#FF4343" };

    public SettingsPage()
    {
        this.InitializeComponent();

        AppSettingsModel settings = App.SettingsVM.Current;

        ThemeCombo.SelectedIndex = settings.Theme switch
        {
            "Light" => 1,
            "System" => 2,
            _ => 0,
        };
        AccentCombo.SelectedIndex = Math.Max(0,
            Array.IndexOf(AccentHexes, settings.AccentColorHex));
        StartupSwitch.IsOn = settings.StartWithWindows;
        TraySwitch.IsOn = settings.MinimizeToTray;
        SoundSwitch.IsOn = settings.SoundEffects;
        ConfirmSwitch.IsOn = settings.ConfirmBeforeSlotDelete;

        CachePathText.Text = App.SettingsVM.CachePath;
        StatusText.Text = App.SettingsVM.StatusMessage;
    }

    private void OnControlChanged(object sender, RoutedEventArgs e)
    {
        UpdateSettings();
    }

    private void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        UpdateSettings();
    }

    private void UpdateSettings()
    {
        AppSettingsModel settings = App.SettingsVM.Current;
        settings.Theme = ThemeCombo.SelectedItem is ComboBoxItem item
            ? item.Content.ToString() ?? "Dark"
            : "Dark";
        settings.AccentColorHex = AccentCombo.SelectedIndex >= 0
            ? AccentHexes[AccentCombo.SelectedIndex]
            : "#0078D4";
        settings.StartWithWindows = StartupSwitch.IsOn;
        settings.MinimizeToTray = TraySwitch.IsOn;
        settings.SoundEffects = SoundSwitch.IsOn;
        settings.ConfirmBeforeSlotDelete = ConfirmSwitch.IsOn;
    }

    private void OnSaveClick(object sender, RoutedEventArgs e)
    {
        OnControlChanged(sender, e);
        App.SettingsVM.SaveCommand.Execute(null);
        StatusText.Text = App.SettingsVM.StatusMessage;
    }

    private void OnClearCacheClick(object sender, RoutedEventArgs e)
    {
        App.SettingsVM.ClearThumbnailCacheCommand.Execute(null);
        StatusText.Text = App.SettingsVM.StatusMessage;
    }

    private void OnExportClick(object sender, RoutedEventArgs e)
    {
        App.SettingsVM.ExportSettingsCommand.Execute(null);
        StatusText.Text = App.SettingsVM.StatusMessage;
    }

    private void OnResetClick(object sender, RoutedEventArgs e)
    {
        App.SettingsVM.Current = new AppSettingsModel();
        ThemeCombo.SelectedIndex = 0;
        AccentCombo.SelectedIndex = 0;
        StartupSwitch.IsOn = true;
        TraySwitch.IsOn = true;
        SoundSwitch.IsOn = true;
        ConfirmSwitch.IsOn = false;
        StatusText.Text = "Defaults restored — click Save to persist.";
    }
}
