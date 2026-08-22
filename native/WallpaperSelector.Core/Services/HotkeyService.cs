using System.Collections.Concurrent;
using System.IO;
using System.Runtime.InteropServices;

namespace WallpaperSelector.Core.Services;

public sealed class HotkeyEventArgs : EventArgs
{
    public int HotkeyId { get; }
    public HotkeyEventArgs(int hotkeyId) => HotkeyId = hotkeyId;
}

public interface IHotkeyService : IDisposable
{
    event EventHandler<HotkeyEventArgs>? HotkeyPressed;

    void Start();
    bool TryRegister(int id, uint modifiers, uint virtualKey, Action action);
    bool IsRegistered(int id);
    int RegisterCount { get; }
    void UnregisterAll();
}

/// <summary>
/// System-wide hotkeys via Win32 RegisterHotKey.
///
/// The hook lives on a hidden message-only window owned by a dedicated
/// background thread with its own message pump, so WM_HOTKEY (0x0312)
/// events are received even when the main WinUI 3 window is minimized or
/// hidden to the tray. This completes the handoff item:
/// "Global Hotkeys — system-wide keyboard hook needs wiring."
///
/// Default bindings (mirroring the web prototype):
///   Win+Alt+W      → open Quick Switcher HUD
///   Win+Alt+1..6   → direct apply slot N
///   Win+Alt+Right  → next slot
///   Win+Alt+Left   → previous slot
/// </summary>
public sealed class HotkeyService : IHotkeyService
{
    #region Constants

    public const uint ModAlt = 0x0001;
    public const uint ModControl = 0x0002;
    public const uint ModShift = 0x0004;
    public const uint ModWin = 0x0008;

    public const int IdPicker = 1;
    public const int IdSlot1 = 2;
    public const int IdSlot2 = 3;
    public const int IdSlot3 = 4;
    public const int IdSlot4 = 5;
    public const int IdSlot5 = 6;
    public const int IdSlot6 = 7;
    public const int IdNext = 8;
    public const int IdPrevious = 9;

    public const uint VkW = 0x57;
    public const uint VkDigit1 = 0x31;
    public const uint VkLeft = 0x25;
    public const uint VkRight = 0x27;

    private const int WM_HOTKEY = 0x0312;
    private const uint WM_QUIT = 0x0012;

    #endregion

    private readonly object _sync = new();
    private readonly ConcurrentDictionary<int, Action> _actions = new();
    private readonly ConcurrentDictionary<int, bool> _registered = new();
    private readonly ManualResetEventSlim _hwndReady = new(false);

    private IntPtr _hwnd = IntPtr.Zero;
    private uint _pumpThreadId;
    private Thread? _pumpThread;
    private Win32.WndProcDelegate? _wndProc; // prevent GC of the delegate
    private bool _started;

    /// <summary>Raised on the hotkey pump thread — subscribers must marshal to the UI thread.</summary>
    public event EventHandler<HotkeyEventArgs>? HotkeyPressed;

    public int RegisterCount => _registered.Count(kv => kv.Value);

    public void Start()
    {
        lock (_sync)
        {
            if (_started) return;
            _started = true;
        }

        _pumpThread = new Thread(MessageLoop)
        {
            IsBackground = true,
            Name = "WallpaperSelector.HotkeyPump",
        };
        _pumpThread.Start();

        _hwndReady.Wait(3000);
    }

    public bool TryRegister(int id, uint modifiers, uint virtualKey, Action action)
    {
        if (_hwnd == IntPtr.Zero) return false;
        _actions[id] = action;

        bool ok = Win32.RegisterHotKey(_hwnd, id, modifiers, virtualKey);
        _registered[id] = ok;
        return ok;
    }

    public bool IsRegistered(int id) => _registered.TryGetValue(id, out bool ok) && ok;

    public void UnregisterAll()
    {
        foreach (int id in _actions.Keys)
        {
            Win32.UnregisterHotKey(_hwnd, id);
            _registered.TryRemove(id, out _);
        }
        _actions.Clear();
    }

    public void Dispose()
    {
        UnregisterAll();

        // Ask the pump thread to quit and wait briefly for it to exit.
        if (_pumpThreadId != 0)
        {
            Win32.PostThreadMessageW(_pumpThreadId, WM_QUIT, IntPtr.Zero, IntPtr.Zero);
        }

        _pumpThread?.Join(500);
        _pumpThread = null;
    }

    private void MessageLoop()
    {
        _pumpThreadId = Win32.GetCurrentThreadId();

        // Keep the WndProc delegate referenced for the lifetime of the window.
        _wndProc = Win32.DefWindowProcW;
        _hwnd = Win32.CreateWindowExW(
            exStyle: 0,
            className: "Static",
            windowName: "WallpaperSelectorHotkeyPump",
            style: 0,
            x: 0, y: 0, width: 0, height: 0,
            parent: Win32.HWND_MESSAGE, // message-only window — never visible
            menu: IntPtr.Zero,
            instance: IntPtr.Zero,
            param: System.Runtime.InteropServices.Marshal.GetFunctionPointerForDelegate(_wndProc));

        _hwndReady.Set();

        var message = default(Win32.MSG);
        while (_hwnd != IntPtr.Zero && Win32.GetMessageW(out message, IntPtr.Zero, 0, 0) > 0)
        {
            if (message.message == WM_HOTKEY && _actions.TryGetValue((int)message.wParam, out Action? action))
            {
                HotkeyPressed?.Invoke(this, new HotkeyEventArgs((int)message.wParam));
                action();
            }

            Win32.TranslateMessage(ref message);
            Win32.DispatchMessageW(ref message);
        }

        _hwnd = IntPtr.Zero;
    }

    #region Win32 interop

    private static class Win32
    {
        public static readonly IntPtr HWND_MESSAGE = new IntPtr(-3);

        [UnmanagedFunctionPointer(CallingConvention.Winapi)]
        public delegate IntPtr WndProcDelegate(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern IntPtr CreateWindowExW(
            uint exStyle, string className, string windowName, uint style,
            int x, int y, int width, int height,
            IntPtr parent, IntPtr menu, IntPtr instance, IntPtr param);

        [DllImport("user32.dll")]
        public static extern IntPtr DefWindowProcW(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll")]
        public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [StructLayout(LayoutKind.Sequential)]
        public struct MSG
        {
            public IntPtr hwnd;
            public uint message;
            public IntPtr wParam;
            public IntPtr lParam;
            public uint time;
            public int ptX;
            public int ptY;
        }

        [DllImport("user32.dll")]
        public static extern int GetMessageW(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

        [DllImport("user32.dll")]
        public static extern bool TranslateMessage(ref MSG lpMsg);

        [DllImport("user32.dll")]
        public static extern IntPtr DispatchMessageW(ref MSG lpMsg);

        [DllImport("user32.dll")]
        public static extern bool PostThreadMessageW(uint threadId, uint msg, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll")]
        public static extern uint GetCurrentThreadId();
    }

    #endregion
}
