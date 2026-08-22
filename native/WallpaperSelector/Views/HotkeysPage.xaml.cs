using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using WallpaperSelector.Core.Services;

namespace WallpaperSelector.Views;

public sealed partial class HotkeysPage : Page
{
    public HotkeysPage()
    {
        this.InitializeComponent();
        LoadBindings();
        UpdateStatus();
    }

    private void LoadBindings()
    {
        BindingList.Items.Clear();

        foreach (HotkeyBindingSpec binding in App.HotkeyBindings)
        {
            bool ok = App.Hotkeys.IsRegistered(binding.Id);
            BindingList.Items.Add(new BindingRow(binding.Display,
                ok ? "Registered" : "Failed — re-register", ok));
        }
    }

    private void UpdateStatus()
    {
        int ok = App.Hotkeys.RegisterCount;
        int total = App.HotkeyBindings.Count;
        StatusText.Text = $"Global hotkeys: {ok}/{total} registered";

        bool allGood = ok == total && total > 0;
        StatusGlyph.Glyph = allGood ? "\uE943" : "\uE7BA";
        StatusGlyph.Foreground = new SolidColorBrush(
            allGood ? Color.FromArgb(0xFF, 0x6C, 0xF5, 0x6C) : Color.FromArgb(0xFF, 0xFF, 0xB9, 0x00));
    }

    private void OnReregisterClick(object sender, RoutedEventArgs e)
    {
        // Re-wire the whole binding table (e.g. after a conflicting app released its hooks).
        App.Hotkeys.UnregisterAll();

        int registered = 0;
        foreach (HotkeyBindingSpec binding in App.HotkeyBindings)
        {
            if (App.Hotkeys.TryRegister(binding.Id, binding.Modifiers, binding.VirtualKey, binding.Action))
            {
                registered++;
            }
        }

        LoadBindings();
        UpdateStatus();
    }

    private void OnTestPickerClick(object sender, RoutedEventArgs e)
    {
        // Trigger the same action the Win+Alt+W hotkey raises.
        var picker = App.HotkeyBindings.FirstOrDefault(b => b.Id == HotkeyService.IdPicker);
        picker?.Action();
    }
}

/// <summary>Row model for the hotkey binding list (keeps the XAML template simple).</summary>
public sealed class BindingRow
{
    public string Display { get; }
    public string State { get; }
    public bool Ok { get; }

    public BindingRow(string display, string state, bool ok)
    {
        Display = display;
        State = state;
        Ok = ok;
    }
}
