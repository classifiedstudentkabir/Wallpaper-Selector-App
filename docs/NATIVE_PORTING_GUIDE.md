# Native WinUI 3 Porting Guide

The **web prototype at the repository root** (`index.html`, `src/`, `vite.config.ts`) is the
**UI reference**: its layout, feature behavior and copy define what the native app must do.
It is preserved as-is and is **not** part of the .NET solution.

An identical `design2/` snapshot of the web prototype is kept at the repository root as
well — see `design2/README.md` for the per-folder documentation. When you change the
prototype, mirror the change into `design2/` in the same commit.

The native app lives in `WallpaperSelector.sln`:

```
WallpaperSelector.sln
└── native/
    ├── WallpaperSelector/            WinUI 3 app (net8.0-windows10.0.19041.0)
    │   ├── App.xaml / App.xaml.cs    Composition root: services + view models
    │   ├── Program.cs                Unpackaged WinUI 3 entry point
    │   ├── MainWindow.xaml(.cs)      Mica title bar, NavigationView, hotkey wiring
    │   ├── Views/
    │   │   ├── HomePage.xaml(.cs)        6-slot grid, drag-and-drop reorder, file pickers
    │   │   ├── QuickSwitcherFlyout.cs    Win+Alt+W HUD (centered light-dismiss flyout)
    │   │   ├── HotkeysPage.xaml(.cs)     Binding table + re-register controls
    │   │   ├── AutoRotatePage.xaml(.cs)  Scheduler UI (interval, shuffle, countdown)
    │   │   ├── SettingsPage.xaml(.cs)    Theme/accent, startup, cache, export
    │   │   └── AboutPage.xaml(.cs)       Handoff summary + GitHub link
    │   └── Assets/                   AppIcon.png, SplashScreen.png
    ├── WallpaperSelector.Core/       net8.0-windows — portable, unit-testable
    │   ├── Models/                   WallpaperSlot, FitMode, ImageFilters, config models
    │   ├── Services/
    │   │   ├── WallpaperService.cs   SystemParametersInfo + IDesktopWallpaper COM + fit registry
    │   │   ├── StorageService.cs     slots.json with schema healing, image store, export/import
    │   │   ├── ThumbnailService.cs   500px PNG thumbnails (System.Drawing)
    │   │   ├── SettingsService.cs    settings/hotkeys/autorotate.json + Run-at-startup key
    │   │   └── HotkeyService.cs      RegisterHotKey on a message-only window (dumb terminal pump)
    │   └── ViewModels/               MainViewModel, AutoRotateViewModel, SettingsViewModel
    └── WallpaperSelector.Tests/      xUnit — handoff edge cases
```

## 1. Web prototype → native feature map

| Web prototype (UI reference) | Native implementation |
| --- | --- |
| `TitleBar.tsx` (Mica title bar, hotkey pill, window controls) | `MainWindow.xaml` `AppTitleBarRoot` + `ExtendsContentIntoTitleBar` + `DesktopAcrylicBackdrop` (Mica) with `OverlappedPresenter` caption buttons |
| `NavigationSidebar.tsx` (Home / Hotkeys / Rotate / Diagnostics / Settings / About) | `NavigationView` in `MainWindow.xaml` (Home, Global Hotkeys, Auto-Rotate, About, built-in Settings) |
| `SlotGrid.tsx` + `SlotCard.tsx` (6-slot dashboard, drag & drop, apply/clear/move) | `HomePage.xaml` `ListView` + `DataTemplate`; reorder via pointer-capture drag **and** ↑/↓ buttons → `MainViewModel.ReorderSlots` (strict 1..6 re-index) |
| `QuickSwitcherFlyout.tsx` (Win+Alt+W HUD, keys 1–6, arrows, ESC) | `QuickSwitcherFlyout` (WinUI `Flyout`, centered, light-dismiss) + `HotkeyService` global hooks; keyboard inside the HUD is covered by the global hooks themselves |
| `ImageEditorModal.tsx` (fit modes, filters, monitor target) | `WallpaperSlot.FitMode/TargetMonitor/Filters` persisted with the slot; fit applied via `Control Panel\Desktop` registry (`WallpaperService.ApplyFitMode`); filters persist for previews |
| `AutoRotateScheduler.tsx` (interval, shuffle, countdown) | `AutoRotateViewModel` (thread-pool timer, persists `autorotate.json`) + `AutoRotatePage` |
| `HotkeyManager.tsx` (Win+Alt+W etc., live tester) | `HotkeyService.cs` + `HotkeysPage` (registration status, re-register, test picker) |
| `UnitTestsRunner.tsx` (edge cases) | `WallpaperSelector.Tests` (xUnit) — see §4 |
| `SettingsPage.tsx` (theme, accent, startup, cache) | `SettingsPage` + `SettingsService` (HKCU Run key, thumbnail cache clear, export) |
| `AboutPage.tsx` (handoff summary) | `AboutPage` — same spec text + repository link |
| `SoundService.ts` (Web Audio cues) | *Optional in native* — wire `System.Media.SoundPlayer` or WinUI `MediaElement` to `MainViewModel` status changes |
| One-time welcome celebration (confetti + side-panel notice on the **first** apply only, silent afterwards; replay/re-arm in Settings) | *Pending* — gate a `TeachingTip`/InfoBar + confetti on a persisted `celebrationShown` flag in `settings.json`; expose preview + re-arm buttons on `SettingsPage` |

## 2. Build & run (Windows 10 17763+ / Windows 11)

Prereqs: Visual Studio 2022 17.8+ (Desktop C# workload) or the .NET 8 SDK + `dotnet workload` Windows App SDK.

```bash
# Restore + build
dotnet build WallpaperSelector.sln -c Release -p:Platform=x64

# Run the unpackaged app
native\WallpaperSelector\bin\x64\Release\net8.0-windows10.0.19041.0\WallpaperSelector.exe
# (first run requires the Windows App SDK runtime; or publish self-contained:
#  dotnet publish native/WallpaperSelector -c Release -r win-x64 --self-contained)

# Tests
dotnet test WallpaperSelector.sln -c Release -p:Platform=x64
```

## 3. Global hotkey wiring (handoff item, completed)

`HotkeyService.cs` creates a hidden **message-only window** (`HWND_MESSAGE`) on a dedicated
background thread that runs its own `GetMessage` loop. `RegisterHotKey(hwnd, id, MOD_WIN | MOD_ALT, vk)`
is called against that window, so `WM_HOTKEY` (0x0312) arrives even when the main window is
minimized or hidden to the tray. Callbacks fire on the pump thread; `MainWindow.WireGlobalHotkeys`
marshals each action with `DispatcherQueue.TryEnqueue`.

Default bindings: `Win+Alt+W` picker · `Win+Alt+1..6` direct apply · `Win+Alt+Right/Left` cycle.
The Hotkeys page exposes per-binding registration status and a re-register button for
`ERROR_HOTKEY_ALREADY_REGISTERED` recovery.

## 4. Edge cases (handoff item, covered by tests)

| Edge case | Where handled | Test |
| --- | --- | --- |
| Source image deleted/moved | `MainViewModel.VerifySources` flags `IsSourceMissing`; apply refuses; card shows amber banner; cached thumbnail still renders | `ApplyWallpaper_WithMissingSource_DoesNotCallService`, `VerifySources_FlagsMissingFiles`, `ImportImage_WhenSourceDeleted_ThrowsFileNotFound` |
| Corrupted settings JSON | `StorageService.LoadSlotsAsync` quarantines the bad file and heals to six defaults (same for settings/hotkeys/autorotate JSON) | `LoadSlots_WithCorruptJson_RecoversToDefaults` |
| Reorder integrity | `MainViewModel.ReorderSlots` + `StorageService.Normalize` enforce exactly slots 1..6, no duplicates | `ReorderSlots_AlwaysPreservesStrict1To6Sequence`, `Normalize_DuplicateSlotNumbers_ReindexesToStrict1To6` |
| Fit mode correctness | Pure `FitModeToRegistryValues` mapping (Fill=10, Fit=6, Stretch=2, Center=0, Tile=0/1, Span=22) | `FitMode_MapsToExpectedRegistryValues` (Theory) |
| Missing file at apply time | `WallpaperService.SetWallpaperAsync` file-exists guard | `SetWallpaper_MissingFile_ReturnsFalseWithoutCrash` |

## 5. Remaining work list (tracked)

- **Tray icon** — add `UseWindowsForms` + `NotifyIcon` in the app project; on close,
  `Hide()` when `Settings.MinimizeToTray` is true (setting already persisted).
- **Sound cues** — mirror web `SoundService` with `SoundPlayer` (apply/chord, flyout pop).
- **Day/Night switching** — `AutoRotateConfigModel.DaySlot/NightSlot` persist; add the
  6:00/19:00 boundary check inside `AutoRotateViewModel.Tick`.
- **In-app filter preview** — filters persist; render them on the slot card (e.g. `Image`
  `Opacity/Desaturation` approximations or a `Win2D` `Effect` pipeline).
- **MSIX packaging** — assets already in `Assets/`; build with
  `dotnet build /p:GenerateAppxPackage=true` for Store sideloading.
- **CI** — GitHub Actions `windows-latest`: `dotnet build` + `dotnet test` the solution.
