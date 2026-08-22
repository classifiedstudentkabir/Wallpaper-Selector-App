using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using WallpaperSelector.Core.Models;
using WallpaperSelector.Core.Services;

namespace WallpaperSelector.Core.ViewModels;

/// <summary>
/// Auto-rotation scheduler. The timer runs on a thread-pool thread and
/// raises <see cref="SlotChanged"/> after each rotation; the WinUI page
/// marshals to the UI thread when it needs to refresh.
/// </summary>
public sealed partial class AutoRotateViewModel : ObservableObject
{
    private readonly MainViewModel _main;
    private readonly SettingsService _settings;
    private Timer? _timer;
    private readonly Random _random = new();

    [ObservableProperty]
    private bool _isRunning;

    [ObservableProperty]
    private double _intervalMinutes = 15;

    [ObservableProperty]
    private bool _shuffle;

    [ObservableProperty]
    private int _secondsRemaining;

    [ObservableProperty]
    private int _daySlot = 1;

    [ObservableProperty]
    private int _nightSlot = 4;

    /// <summary>Raised on a background thread whenever a slot switch fires.</summary>
    public event EventHandler? SlotChanged;

    public IReadOnlyList<WallpaperSlot> Slots => _main.Slots;

    public AutoRotateViewModel(MainViewModel main, SettingsService settings)
    {
        _main = main;
        _settings = settings;

        AutoRotateConfigModel config = settings.LoadAutoRotate();
        IntervalMinutes = config.IntervalMinutes;
        Shuffle = config.Shuffle;
        DaySlot = config.DaySlot;
        NightSlot = config.NightSlot;
        SecondsRemaining = (int)Math.Max(1, Math.Round(IntervalMinutes * 60));

        if (config.Enabled)
        {
            IsRunning = true;
            _timer = new Timer(_ => Tick(), null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
        }
    }

    [RelayCommand]
    public void ToggleRunning()
    {
        IsRunning = !IsRunning;

        if (IsRunning)
        {
            _timer = new Timer(_ => Tick(), null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
        }
        else
        {
            _timer?.Dispose();
            _timer = null;
        }

        Persist();
    }

    [RelayCommand]
    public void RotateNow()
    {
        int index = PickNextIndex();
        if (index >= 0 && index < _main.Slots.Count)
        {
            _ = _main.ApplyWallpaperAsync(_main.Slots[index]);
        }
        SecondsRemaining = (int)Math.Max(1, Math.Round(IntervalMinutes * 60));
    }

    partial void OnIntervalMinutesChanged(double value)
    {
        SecondsRemaining = (int)Math.Max(1, Math.Round(value * 60));
        Persist();
    }

    partial void OnShuffleChanged(bool value) => Persist();
    partial void OnDaySlotChanged(int value) => Persist();
    partial void OnNightSlotChanged(int value) => Persist();

    private void Tick()
    {
        if (!IsRunning) return;

        SecondsRemaining -= 1;
        if (SecondsRemaining <= 0)
        {
            SecondsRemaining = (int)Math.Max(1, Math.Round(IntervalMinutes * 60));

            int index = PickNextIndex();
            if (index >= 0 && index < _main.Slots.Count)
            {
                _ = _main.ApplyWallpaperAsync(_main.Slots[index]);
                SlotChanged?.Invoke(this, EventArgs.Empty);
            }
        }
    }

    private int PickNextIndex()
    {
        var slots = _main.Slots;
        if (slots.Count == 0) return -1;

        if (Shuffle)
        {
            return _random.Next(slots.Count);
        }

        int current = _main.IndexOf(_main.ActiveSlot);
        return ((current + 1) % slots.Count + slots.Count) % slots.Count;
    }

    private void Persist()
    {
        _settings.SaveAutoRotate(new AutoRotateConfigModel
        {
            Enabled = IsRunning,
            IntervalMinutes = IntervalMinutes,
            Shuffle = Shuffle,
            DaySlot = DaySlot,
            NightSlot = NightSlot,
        });
    }

    public void Dispose()
    {
        _timer?.Dispose();
        _timer = null;
    }
}
