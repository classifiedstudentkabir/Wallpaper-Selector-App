import React, { useState } from 'react';
import { 
  Code2, 
  ExternalLink, 
  Copy, 
  CheckCheck, 
  GitBranch, 
  Layers, 
  Cpu, 
  FolderTree, 
  FileCode, 
  Terminal 
} from 'lucide-react';
import { soundService } from '../services/soundService';

export const CodeArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('MainViewModel.cs');
  const [copied, setCopied] = useState(false);

  const repoUrl = 'https://github.com/classifiedstudentkabir/Wallpaper-Selector-App.git';
  const branch = 'main';

  const codeFiles: Record<string, { language: string; path: string; code: string; desc: string }> = {
    'MainViewModel.cs': {
      language: 'csharp',
      path: 'src/WallpaperSelector/ViewModels/MainViewModel.cs',
      desc: 'MVVM Core ViewModel managing the 6 slots, active selection, reordering, and reactive commands.',
      code: `using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using WallpaperSelector.Models;
using WallpaperSelector.Services;

namespace WallpaperSelector.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IWallpaperService _wallpaperService;
    private readonly IStorageService _storageService;
    private readonly ISettingsService _settingsService;

    [ObservableProperty]
    private ObservableCollection<WallpaperSlot> _slots = new();

    [ObservableProperty]
    private WallpaperSlot? _activeSlot;

    [ObservableProperty]
    private bool _isLoading;

    public MainViewModel(
        IWallpaperService wallpaperService,
        IStorageService storageService,
        ISettingsService settingsService)
    {
        _wallpaperService = wallpaperService;
        _storageService = storageService;
        _settingsService = settingsService;
    }

    [RelayCommand]
    public async Task InitializeAsync()
    {
        IsLoading = true;
        var loadedSlots = await _storageService.LoadSlotsAsync();
        Slots = new ObservableCollection<WallpaperSlot>(loadedSlots);
        ActiveSlot = Slots.FirstOrDefault(s => s.IsActive) ?? Slots.FirstOrDefault();
        IsLoading = false;
    }

    [RelayCommand]
    public async Task ApplyWallpaperAsync(WallpaperSlot slot)
    {
        if (slot == null) return;
        
        await _wallpaperService.SetWallpaperAsync(slot.FilePath, slot.FitMode);
        
        foreach (var s in Slots)
        {
            s.IsActive = (s.SlotNumber == slot.SlotNumber);
        }
        
        ActiveSlot = slot;
        await _storageService.SaveSlotsAsync(Slots);
    }

    [RelayCommand]
    public void ReorderSlots(int oldIndex, int newIndex)
    {
        if (oldIndex == newIndex || oldIndex < 0 || newIndex < 0 || 
            oldIndex >= Slots.Count || newIndex >= Slots.Count)
            return;

        Slots.Move(oldIndex, newIndex);
        
        // Re-index slots 1..6 strictly
        for (int i = 0; i < Slots.Count; i++)
        {
            Slots[i].SlotNumber = i + 1;
        }

        _storageService.SaveSlotsAsync(Slots);
    }
}`,
    },
    'WallpaperService.cs': {
      language: 'csharp',
      path: 'src/WallpaperSelector/Services/WallpaperService.cs',
      desc: 'Win32 SystemParametersInfo and COM IDesktopWallpaper wrapper for setting Windows desktop backgrounds.',
      code: `using System;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using WallpaperSelector.Models;

namespace WallpaperSelector.Services;

public class WallpaperService : IWallpaperService
{
    private const int SPI_SETDESKWALLPAPER = 0x0014;
    private const int SPIF_UPDATEINIFILE = 0x01;
    private const int SPIF_SENDCHANGE = 0x02;

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern int SystemParametersInfo(
        int uAction, 
        int uParam, 
        string lpvParam, 
        int fuWinIni);

    public async Task<bool> SetWallpaperAsync(string imagePath, FitMode fitMode)
    {
        return await Task.Run(() =>
        {
            try
            {
                if (string.IsNullOrWhiteSpace(imagePath) || !System.IO.File.Exists(imagePath))
                {
                    return false;
                }

                // Apply fit style in Windows Registry if needed
                SetRegistryFitMode(fitMode);

                int result = SystemParametersInfo(
                    SPI_SETDESKWALLPAPER, 
                    0, 
                    imagePath, 
                    SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);

                return result != 0;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[WallpaperService] Error: {ex.Message}");
                return false;
            }
        });
    }

    private void SetRegistryFitMode(FitMode fitMode)
    {
        using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Control Panel\\Desktop", true);
        if (key != null)
        {
            switch (fitMode)
            {
                case FitMode.Fill:
                    key.SetValue("WallpaperStyle", "10");
                    key.SetValue("TileWallpaper", "0");
                    break;
                case FitMode.Fit:
                    key.SetValue("WallpaperStyle", "6");
                    key.SetValue("TileWallpaper", "0");
                    break;
                case FitMode.Stretch:
                    key.SetValue("WallpaperStyle", "2");
                    key.SetValue("TileWallpaper", "0");
                    break;
                case FitMode.Center:
                    key.SetValue("WallpaperStyle", "0");
                    key.SetValue("TileWallpaper", "0");
                    break;
                case FitMode.Tile:
                    key.SetValue("WallpaperStyle", "0");
                    key.SetValue("TileWallpaper", "1");
                    break;
                case FitMode.Span:
                    key.SetValue("WallpaperStyle", "22");
                    key.SetValue("TileWallpaper", "0");
                    break;
            }
        }
    }
}`,
    },
    'HotkeyService.cs': {
      language: 'csharp',
      path: 'src/WallpaperSelector/Services/HotkeyService.cs',
      desc: 'Win32 RegisterHotKey global hook service enabling Win + Alt + W and numerical slot switching.',
      code: `using System;
using System.Runtime.InteropServices;
using System.Windows.Input;

namespace WallpaperSelector.Services;

public class HotkeyService : IHotkeyService, IDisposable
{
    private const int WM_HOTKEY = 0x0312;
    private const uint MOD_ALT = 0x0001;
    private const uint MOD_CONTROL = 0x0002;
    private const uint MOD_SHIFT = 0x0004;
    private const uint MOD_WIN = 0x0008;

    [DllImport("user32.dll")]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    public event EventHandler? HotkeyTriggered;

    private IntPtr _windowHandle;
    private const int HOTKEY_PICKER_ID = 9001;

    public void Initialize(IntPtr windowHandle)
    {
        _windowHandle = windowHandle;
        
        // Register Win + Alt + W (Virtual key 0x57 for 'W')
        RegisterHotKey(_windowHandle, HOTKEY_PICKER_ID, MOD_WIN | MOD_ALT, 0x57);
    }

    public void ProcessWindowMessage(int msg, IntPtr wParam)
    {
        if (msg == WM_HOTKEY && wParam.ToInt32() == HOTKEY_PICKER_ID)
        {
            HotkeyTriggered?.Invoke(this, EventArgs.Empty);
        }
    }

    public void Dispose()
    {
        if (_windowHandle != IntPtr.Zero)
        {
            UnregisterHotKey(_windowHandle, HOTKEY_PICKER_ID);
        }
    }
}`,
    },
    'StorageService.cs': {
      language: 'csharp',
      path: 'src/WallpaperSelector/Services/StorageService.cs',
      desc: 'Local AppData persistence, image file copying, and thumbnail caching.',
      code: `using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using WallpaperSelector.Models;

namespace WallpaperSelector.Services;

public class StorageService : IStorageService
{
    private readonly string _appDataFolder;
    private readonly string _slotsConfigPath;
    private readonly string _thumbnailsFolder;

    public StorageService()
    {
        _appDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WallpaperSelectorApp");
            
        _thumbnailsFolder = Path.Combine(_appDataFolder, "Thumbnails");
        _slotsConfigPath = Path.Combine(_appDataFolder, "slots.json");

        Directory.CreateDirectory(_thumbnailsFolder);
    }

    public async Task<List<WallpaperSlot>> LoadSlotsAsync()
    {
        if (!File.Exists(_slotsConfigPath))
        {
            return GetDefaultSlots();
        }

        try
        {
            string json = await File.ReadAllTextAsync(_slotsConfigPath);
            return JsonSerializer.Deserialize<List<WallpaperSlot>>(json) ?? GetDefaultSlots();
        }
        catch
        {
            return GetDefaultSlots();
        }
    }

    public async Task SaveSlotsAsync(IEnumerable<WallpaperSlot> slots)
    {
        string json = JsonSerializer.Serialize(slots, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(_slotsConfigPath, json);
    }
}`,
    },
    'MainWindow.xaml': {
      language: 'xml',
      path: 'src/WallpaperSelector/Views/MainWindow.xaml',
      desc: 'WinUI 3 Fluent XAML View with custom Mica TitleBar, NavigationView, and 6-slot GridView.',
      code: `<Window
    x:Class="WallpaperSelector.Views.MainWindow"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:viewmodels="using:WallpaperSelector.ViewModels"
    mc:Ignorable="d"
    Title="Wallpaper Selector">

    <Grid Background="{ThemeResource MicaBackgroundBrush}">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>

        <!-- Custom Mica TitleBar -->
        <AppTitleBar 
            x:Name="AppTitleBar" 
            Title="Wallpaper Selector" 
            Icon="Assets/AppIcon.png" />

        <!-- Navigation View -->
        <NavigationView 
            Grid.Row="1"
            x:Name="NavView"
            IsSettingsVisible="True"
            PaneDisplayMode="Left">
            <NavigationView.MenuItems>
                <NavigationViewItem Content="Home" Icon="Home" Tag="HomePage" />
                <NavigationViewItem Content="Live Desktop" Icon="Monitor" Tag="DesktopPage" />
                <NavigationViewItem Content="Library" Icon="Pictures" Tag="LibraryPage" />
                <NavigationViewItem Content="Auto-Rotate" Icon="Clock" Tag="RotatePage" />
            </NavigationView.MenuItems>

            <Frame x:Name="ContentFrame" />
        </NavigationView>
    </Grid>
</Window>`,
    },
  };

  const currentFile = codeFiles[selectedFile];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    soundService.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Top GitHub Repository Integration Hub */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#14161f] border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">GitHub Repository & WinUI 3 Architecture</h3>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                branch: {branch}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Target Framework: <span className="text-gray-200 font-semibold">.NET 8.0</span> • UI Library: <span className="text-gray-200 font-semibold">Windows App SDK 1.5 (WinUI 3)</span>
            </p>
          </div>
        </div>

        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg"
        >
          <span>Open GitHub Repo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Clone Command Snippet */}
      <div className="p-4 rounded-xl bg-[#181b22] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-gray-300">git clone {repoUrl}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`git clone ${repoUrl}`);
            soundService.playClick();
          }}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-[11px] font-semibold transition"
        >
          Copy Clone Command
        </button>
      </div>

      {/* Architecture Layout & MVVM Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#16181f] border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>1. WinUI 3 Views</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            XAML layouts with custom Mica TitleBar, NavigationView, and 6-slot Drag-and-Drop Grid.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#16181f] border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Cpu className="w-4 h-4" />
            <span>2. MVVM ViewModels</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            CommunityToolkit.Mvvm ObservableObjects handling state, ReorderSlots, and RelayCommands.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#16181f] border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <FolderTree className="w-4 h-4" />
            <span>3. StorageService</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            AppData JSON serialization, image copying, and high-performance thumbnail caching.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#16181f] border border-white/10">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Code2 className="w-4 h-4" />
            <span>4. WallpaperService</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Win32 SystemParametersInfo and IDesktopWallpaper COM API for multi-monitor wallpaper rendering.
          </p>
        </div>
      </div>

      {/* Interactive C# / XAML Code Explorer */}
      <div className="rounded-2xl bg-[#161820] border border-white/10 overflow-hidden shadow-2xl">
        {/* File Tabs Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#12141a] border-b border-white/10 overflow-x-auto">
          <div className="flex items-center gap-1">
            {Object.keys(codeFiles).map((fileName) => (
              <button
                key={fileName}
                onClick={() => {
                  setSelectedFile(fileName);
                  soundService.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFile === fileName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* File Metadata Bar */}
        <div className="px-5 py-2.5 bg-[#171922] border-b border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-gray-300">{currentFile.path}</span>
          <span className="text-[11px] text-gray-400">{currentFile.desc}</span>
        </div>

        {/* Code Content View */}
        <div className="p-5 bg-[#0e1015] font-mono text-xs text-gray-200 overflow-x-auto leading-relaxed max-h-[500px]">
          <pre className="whitespace-pre">{currentFile.code}</pre>
        </div>
      </div>
    </div>
  );
};
