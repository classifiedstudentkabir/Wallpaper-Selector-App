using System.IO;
using Microsoft.UI;
using Microsoft.UI.Composition.SystemBackdrops;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using WallpaperSelector.Core.Services;
using WallpaperSelector.Views;
using WinRT.Interop;

namespace WallpaperSelector;

public sealed partial class MainWindow : Window
{
    private readonly QuickSwitcherFlyout _quickFlyout;
    private DesktopAcrylicBackdrop? _backdrop;
    private AppWindow? _appWindow;

    public MainWindow()
    {
        this.InitializeComponent();

        // Cache the AppWindow handle for title-bar and presenter APIs.
        IntPtr hwnd = WindowNative.GetWindowHandle(this);
        WindowId windowId = Win32Interop.GetWindowIdFromWindow(hwnd);
        _appWindow = AppWindow.GetFromWindowId(windowId);

        // Set window size via AppWindow (WinUI 3 Window has no Width/Height).
        _appWindow?.Resize(new Windows.Graphics.SizeInt32(1150, 750));

        // Extend Mica into the custom title bar.
        this.ExtendsContentIntoTitleBar = true;
        this.SetTitleBar(AppTitleBarRoot);

        try
        {
            _backdrop = new DesktopAcrylicBackdrop();
            this.SystemBackdrop = _backdrop;
        }
        catch
        {
            // Solid fallback on systems where the backdrop API is unavailable.
        }

        // Quick Switcher HUD (Win + Alt + W)
        _quickFlyout = new QuickSwitcherFlyout();
        _quickFlyout.SlotSelected += index => ApplySlotIndex(index);

        WireGlobalHotkeys();

        NavView.SelectedItem = HomeItem;
    }

    #region Navigation

    private void OnNavSelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.IsSettingsSelected)
        {
            ContentFrame.Navigate(typeof(SettingsPage));
        }
        else if (args.SelectedItem is NavigationViewItem item)
        {
            ContentFrame.Navigate(item.Tag switch
            {
                "Hotkeys" => typeof(HotkeysPage),
                "AutoRotate" => typeof(AutoRotatePage),
                "About" => typeof(AboutPage),
                _ => typeof(HomePage),
            });
        }
    }

    #endregion

    #region Title bar window commands

    private void OnMinimizeClick(object sender, RoutedEventArgs e)
    {
        if (_appWindow?.Presenter is OverlappedPresenter p)
        {
            p.Minimize();
        }
    }

    private void OnMaximizeClick(object sender, RoutedEventArgs e)
    {
        if (_appWindow?.Presenter is OverlappedPresenter p)
        {
            if (p.State == OverlappedPresenterState.Maximized)
            {
                p.Restore();
                MaximizeGlyph.Glyph = "\uE922";
            }
            else
            {
                p.Maximize();
                MaximizeGlyph.Glyph = "\uE923";
            }
        }
    }

    private void OnCloseClick(object sender, RoutedEventArgs e) => this.Close();

    #endregion

    #region Global hotkeys

    /// <summary>
    /// Registers the system-wide hooks on the HotkeyService message-only window.
    /// Bindings are exposed through App.HotkeyBindings so the Hotkeys page can
    /// display and re-register them at runtime.
    /// </summary>
    public void WireGlobalHotkeys()
    {
        App.HotkeyBindings.Clear();
        var bindings = App.HotkeyBindings;

        bindings.Add(new HotkeyBindingSpec(
            HotkeyService.IdPicker,
            HotkeyService.ModWin | HotkeyService.ModAlt,
            HotkeyService.VkW,
            "Win+Alt+W",
            OpenQuickSwitcher));

        for (int i = 0; i < 6; i++)
        {
            int slotIndex = i;
            bindings.Add(new HotkeyBindingSpec(
                HotkeyService.IdSlot1 + i,
                HotkeyService.ModWin | HotkeyService.ModAlt,
                HotkeyService.VkDigit1 + (uint)i,
                $"Win+Alt+{i + 1}",
                () => ApplySlotIndex(slotIndex)));
        }

        bindings.Add(new HotkeyBindingSpec(
            HotkeyService.IdNext,
            HotkeyService.ModWin | HotkeyService.ModAlt,
            HotkeyService.VkRight,
            "Win+Alt+Right",
            () => _ = App.MainVM.CycleAsync(true)));

        bindings.Add(new HotkeyBindingSpec(
            HotkeyService.IdPrevious,
            HotkeyService.ModWin | HotkeyService.ModAlt,
            HotkeyService.VkLeft,
            "Win+Alt+Left",
            () => _ = App.MainVM.CycleAsync(false)));

        App.Hotkeys.Start();

        int registered = 0;
        foreach (HotkeyBindingSpec binding in bindings)
        {
            // Hotkey callbacks arrive on the pump thread — always marshal to the UI thread.
            if (App.Hotkeys.TryRegister(binding.Id, binding.Modifiers, binding.VirtualKey,
                () => this.DispatcherQueue.TryEnqueue(binding.Action)))
            {
                registered++;
            }
        }

        HotkeyStatusText.Text = $"Global hotkeys: {registered}/{bindings.Count} registered";
    }

    #endregion

    #region Quick Switcher actions

    private void OnQuickPickerClick(object sender, RoutedEventArgs e) => OpenQuickSwitcher();

    public void OpenQuickSwitcher()
    {
        if (_appWindow != null && !_appWindow.IsVisible)
        {
            if (_appWindow.Presenter is OverlappedPresenter p) p.Restore();
            this.Activate();
        }

        _quickFlyout.RefreshFromSlots(App.MainVM.Slots);
        _quickFlyout.ShowAt(AppTitleBarRoot);
    }

    private void ApplySlotIndex(int index)
    {
        if (index >= 0 && index < App.MainVM.Slots.Count)
        {
            _ = App.MainVM.ApplyWallpaperAsync(App.MainVM.Slots[index]);
        }
    }

    #endregion
}
