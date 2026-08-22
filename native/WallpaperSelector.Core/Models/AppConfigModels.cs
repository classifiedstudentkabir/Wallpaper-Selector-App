namespace WallpaperSelector.Core.Models;

/// <summary>Persisted application preferences (settings.json).</summary>
public sealed class AppSettingsModel
{
    /// <summary>"Dark" | "Light" | "System"</summary>
    public string Theme { get; set; } = "Dark";

    /// <summary>Hex accent color, e.g. "#0078D4" (Windows Blue).</summary>
    public string AccentColorHex { get; set; } = "#0078D4";

    public bool StartWithWindows { get; set; } = true;
    public bool MinimizeToTray { get; set; } = true;
    public bool SoundEffects { get; set; } = true;
    public bool HardwareAcceleration { get; set; } = true;
    public bool ConfirmBeforeSlotDelete { get; set; }
    public int MaxCacheSizeMb { get; set; } = 500;
}

/// <summary>Persisted hotkey layout (hotkeys.json). Display strings mirror the web prototype.</summary>
public sealed class HotkeyConfigModel
{
    public string OpenPicker { get; set; } = "Win+Alt+W";
    public string NextSlot { get; set; } = "Win+Alt+Right";
    public string PrevSlot { get; set; } = "Win+Alt+Left";
    public string Slot1 { get; set; } = "Win+Alt+1";
    public string Slot2 { get; set; } = "Win+Alt+2";
    public string Slot3 { get; set; } = "Win+Alt+3";
    public string Slot4 { get; set; } = "Win+Alt+4";
    public string Slot5 { get; set; } = "Win+Alt+5";
    public string Slot6 { get; set; } = "Win+Alt+6";
    public bool EnableGlobalHotkeys { get; set; } = true;
}

/// <summary>Persisted auto-rotation schedule (autorotate.json).</summary>
public sealed class AutoRotateConfigModel
{
    public bool Enabled { get; set; }
    public double IntervalMinutes { get; set; } = 15;
    public bool Shuffle { get; set; }
    public bool PauseOnBattery { get; set; } = true;
    public bool TimeOfDayTheme { get; set; }
    public int DaySlot { get; set; } = 1;
    public int NightSlot { get; set; } = 4;
}
