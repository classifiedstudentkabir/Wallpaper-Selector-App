import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Search, 
  Link2, 
  Layers
} from 'lucide-react';
import { WallpaperSlot } from '../types/wallpaper';
import { PRESET_PACKS, DEFAULT_FILTERS } from '../constants/defaultWallpapers';
import { soundService } from '../services/soundService';

interface WallpaperLibraryModalProps {
  isOpen: boolean;
  targetSlotNumber: number;
  onClose: () => void;
  onAssignWallpaper: (slotNumber: number, wallpaperData: Partial<WallpaperSlot>) => void;
}

export const WallpaperLibraryModal: React.FC<WallpaperLibraryModalProps> = ({
  isOpen,
  targetSlotNumber,
  onClose,
  onAssignWallpaper,
}) => {
  if (!isOpen) return null;

  const [selectedSlotNum, setSelectedSlotNum] = useState(targetSlotNumber || 1);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flatten all preset wallpapers for library browsing
  const allPresetWallpapers = PRESET_PACKS.flatMap((p) => p.wallpapers);

  const filteredPresets = allPresetWallpapers.filter((wp) => {
    const matchesCat = selectedCategory === 'All' || wp.category === selectedCategory;
    const matchesSearch = wp.title.toLowerCase().includes(searchQuery.toLowerCase()) || (wp.category && wp.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const categories = ['All', 'Nature', 'Cyberpunk', 'Abstract', 'Space'];

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      
      onAssignWallpaper(selectedSlotNum, {
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        thumbnailUrl: dataUrl,
        sourceType: 'local',
        fileSize: `${sizeMb} MB`,
        resolution: 'Custom Upload',
        category: 'Local Files',
        author: 'My Computer',
        fitMode: 'fill',
        filters: { ...DEFAULT_FILTERS },
      });

      soundService.playSuccess();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  // Handle URL assignment
  const handleAssignUrl = () => {
    if (!customUrl.trim()) return;

    onAssignWallpaper(selectedSlotNum, {
      title: customTitle.trim() || 'Online Wallpaper',
      url: customUrl.trim(),
      thumbnailUrl: customUrl.trim(),
      sourceType: 'url',
      fileSize: '~3.5 MB',
      resolution: 'Web Image',
      category: 'Web URL',
      author: 'Internet',
      fitMode: 'fill',
      filters: { ...DEFAULT_FILTERS },
    });

    soundService.playSuccess();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none transition-all"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#1a1c24] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-flyout text-white"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14161d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Wallpaper Library & File Selector</h3>
              <p className="text-xs text-gray-400">Choose a 4K preset, upload from your PC, or paste an image link</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slot Target Selector Bar */}
        <div className="px-6 py-3 bg-[#171922] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">Target Slot:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedSlotNum(num)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                    selectedSlotNum === num
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'presets' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Curated 4K Presets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload Local File
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'url' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Custom URL
            </button>
          </div>
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 1: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Category Filter & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Wallpaper Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {filteredPresets.map((wp, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onAssignWallpaper(selectedSlotNum, {
                        ...wp,
                        sourceType: 'preset',
                      });
                      soundService.playSuccess();
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-blue-400 bg-[#14161f] cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black/50 relative">
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${wp.thumbnailUrl || wp.url})` }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-lg">
                          Assign to Slot {selectedSlotNum}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5">
                      <h4 className="text-xs font-semibold text-gray-200 truncate group-hover:text-blue-300 transition">
                        {wp.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>{wp.category}</span>
                        <span>{wp.resolution}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Upload Local File */}
          {activeTab === 'upload' && (
            <div className="space-y-6 py-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-blue-500 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-blue-600/[0.04] group"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-gray-200">Click to browse your computer</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Supports JPG, PNG, WebP, BMP, and GIF. Images are locally stored in your browser application cache for Slot {selectedSlotNum}.
                </p>
                <button
                  type="button"
                  className="mt-5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg"
                >
                  Select File from Storage
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#14161f] border border-white/10 text-xs text-gray-400 space-y-1">
                <span className="font-semibold text-gray-200">Windows Storage Service Integration:</span>
                <p>
                  In the desktop WinUI 3 application, local images are securely copied to <code className="text-blue-300 font-mono">AppData\Local\WallpaperSelectorApp\Thumbnails</code> with automatic thumbnail generation.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Custom URL */}
          {activeTab === 'url' && (
            <div className="space-y-4 py-4 max-w-lg mx-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Direct Image URL</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    placeholder="https://example.com/wallpaper.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="My Custom Wallpaper"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {customUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-white/15 relative">
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleAssignUrl}
                disabled={!customUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg cursor-pointer"
              >
                Assign to Slot {selectedSlotNum}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
