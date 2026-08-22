using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace WallpaperSelector.Views;

public sealed partial class AutoRotatePage : Page
{
    private static readonly double[] IntervalsMinutes = { 1.0 / 6, 1, 5, 15, 30, 60 };
    private readonly DispatcherTimer _countdownTimer;

    public AutoRotatePage()
    {
        this.InitializeComponent();

        // Restore persisted running state.
        RunningSwitch.IsOn = App.RotateVM.IsRunning;
        ShuffleSwitch.IsOn = App.RotateVM.Shuffle;

        // Restore persisted interval + shuffle state into the controls.
        int comboIndex = IntervalsMinutes.ToList()
            .FindIndex(i => Math.Abs(i - App.RotateVM.IntervalMinutes) < 0.01);
        IntervalCombo.SelectedIndex = comboIndex >= 0 ? comboIndex : 3;

        // Live countdown readout (UI thread, 1 Hz).
        _countdownTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(1),
        };
        _countdownTimer.Tick += (_, _) =>
        {
            int seconds = App.RotateVM.SecondsRemaining;
            CountdownText.Text = App.RotateVM.IsRunning
                ? $"{seconds / 60:00}:{seconds % 60:00}"
                : "Paused";
        };
        _countdownTimer.Start();

        this.Unloaded += (_, _) => _countdownTimer.Stop();
    }

    private void OnRunningToggled(object sender, RoutedEventArgs e)
    {
        // The TwoWay-free switch hands control to the view model command,
        // which flips IsRunning, (re)starts the timer and persists the config.
        App.RotateVM.ToggleRunningCommand.Execute(null);
    }

    private void OnIntervalChanged(object sender, SelectionChangedEventArgs e)
    {
        if (IntervalCombo.SelectedIndex < 0 || IntervalCombo.SelectedIndex >= IntervalsMinutes.Length) return;
        App.RotateVM.IntervalMinutes = IntervalsMinutes[IntervalCombo.SelectedIndex];
    }

    private void OnShuffleToggled(object sender, RoutedEventArgs e)
    {
        // Persistence handled by the view model's property-changed hook.
    }

    private void OnRotateNowClick(object sender, RoutedEventArgs e)
    {
        App.RotateVM.RotateNowCommand.Execute(null);
        CountdownText.Text = "00:00";
    }
}
