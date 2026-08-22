# Wallpaper Selector — Web Prototype (Design 2)

This folder is the **`design2` snapshot** of the web prototype that lives in the
repository root.

Both copies are identical and **must be kept in sync** for the foreseeable future
(see `docs/NATIVE_PORTING_GUIDE.md` for the native port). The root copy stays
because the project is deployed as a static page from there; this `design2/`
copy exists so the team can build on top of a frozen design revision without
disturbing the production reference.

## What's inside

| File / folder | Purpose |
| --- | --- |
| `index.html` | App entry, title, favicon, root mount node |
| `src/main.tsx` | React bootstrap |
| `src/App.tsx` | Composition root: state, hooks, modals, MVVM wiring, the **one-time welcome celebration** |
| `src/index.css` | Tailwind + Mica/Acrylic backdrop styles, animations |
| `src/types/wallpaper.ts` | `WallpaperSlot`, `ImageFilters`, `AppSettings`, etc. |
| `src/constants/defaultWallpapers.ts` | Six default slots, preset packs, default config |
| `src/utils/cn.ts` | Tailwind class merge helper |
| `src/services/soundService.ts` | Web Audio synth (apply chord, flyout pop, etc.) |
| `src/services/storageService.ts` | LocalStorage persistence with the **one-time celebration flag** |
| `src/services/wallpaperService.ts` | Fit-mode → CSS / registry mapping |
| `src/components/*.tsx` | TitleBar, NavigationSidebar, SlotGrid, SlotCard, QuickSwitcherFlyout, LiveDesktopSimulator, ImageEditorModal, WallpaperLibraryModal, AutoRotateScheduler, HotkeyManager, UnitTestsRunner, CodeArchitectureViewer, SettingsPage, AboutPage, HelpShortcutsModal, ToastNotification |

## Build & run locally

```bash
cd design2
npm install
npm run dev      # Vite dev server (root /src is the source of truth, aliased via vite.config.ts)
npm run build    # produces design2/dist/index.html (single-file bundle)
```

The design2 Vite project is intentionally a **thin shim** that re-uses the
root `/src` source tree through a `resolve.alias` (`@root-src` → `../src`).
That keeps the design2 snapshot byte-for-byte identical to the deployed
prototype and eliminates the maintenance burden of keeping two copies of
roughly 4,000 lines of UI code in sync.

If you ever need a fully standalone design2 with no reference back to the
root sources, copy the contents of `../src/` into `design2/src/` and remove
the `resolve.alias` block from `design2/vite.config.ts`.

## Notes

- The confetti + side-panel notification fire **exactly once** for a new user
  (persisted via `wallpaper_selector_celebration_shown_v1`). After that, every
  wallpaper change is silent. Reset, preview and re-arm live in **Settings →
  First-Run Celebration**.
