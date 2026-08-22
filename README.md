# Wallpaper Selector — Windows 10 / 11 Utility

A lightweight, customizable wallpaper selector for Windows 10 & 11 that manages a curated set of
**up to 6 wallpaper slots** and lets you switch the desktop background instantly via global
hotkeys (`Win + Alt + W` picker, `Win + Alt + 1..6` direct, `Win + Alt + ← / →` cycle).

## Repository layout

```
├── index.html, src/, vite.config.ts      → WEB PROTOTYPE — deployed (root copy, do NOT delete)
├── design2/                              → WEB PROTOTYPE — design2 snapshot (identical copy of root)
├── WallpaperSelector.sln                 → Native .NET 8 WinUI 3 solution
├── native/
│   ├── WallpaperSelector/                → WinUI 3 app (XAML, Mica title bar, NavigationView,
│   │                                       6-slot grid + drag reorder, Win+Alt+W flyout)
│   ├── WallpaperSelector.Core/           → Models, Services (Wallpaper/Storage/Hotkey/Settings),
│   │                                       ViewModels (CommunityToolkit.Mvvm, MVVM)
│   └── WallpaperSelector.Tests/          → xUnit tests for handoff edge cases
└── docs/NATIVE_PORTING_GUIDE.md          → Web-prototype → native feature map, build & test steps
```

The **web prototype at the repository root is the UI reference** for design language and
feature behavior (6-slot dashboard, Quick Switcher HUD, auto-rotate, hotkeys, edge-case
handling). It must be preserved and is **not** part of the native build.

## Building the native app (Windows 10 17763+ / Windows 11)

Prerequisites: Visual Studio 2022 17.8+ with **Desktop development with C#** and
**.NET 8**, plus the Windows App SDK NuGet packages (restored automatically).

```bash
# Build
dotnet build WallpaperSelector.sln -c Release -p:Platform=x64

# Run (unpackaged; requires the Windows App SDK runtime)
native\WallpaperSelector\bin\x64\Release\net8.0-windows10.0.19041.0\WallpaperSelector.exe

# Run tests
dotnet test WallpaperSelector.sln -c Release -p:Platform=x64
```

> Full porting notes, the web → native feature mapping table, global hotkey wiring details
> (Win32 `RegisterHotKey` + message-only window pump), and the remaining edge-case checklist
> live in [`docs/NATIVE_PORTING_GUIDE.md`](docs/NATIVE_PORTING_GUIDE.md).

## Repository

- **Branch:** `main`
- **Source:** `https://github.com/classifiedstudentkabir/Wallpaper-Selector-App.git`
