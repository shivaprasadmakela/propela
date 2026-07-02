import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPlus, 
  faTrash, 
  faSave, 
  faEdit, 
  faCheck, 
  faTimes, 
  faTag,
  faFlag,
  faStar,
  faExclamationTriangle,
  faBookmark,
  faHeart,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { tagApi, type Tag } from '../api/tagApi';

// Premium HSL-aligned color presets by category
const PRESET_VIBRANT = [
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Rose Red', hex: '#F43F5E' },
  { name: 'Orchid Purple', hex: '#D946EF' },
];

const PRESET_MUTED = [
  { name: 'Slate Gray', hex: '#475569' },
  { name: 'Warm Terracotta', hex: '#C2410C' },
  { name: 'Forest Teal', hex: '#0F766E' },
  { name: 'Navy Dusk', hex: '#1E3A8A' },
  { name: 'Crimson Wine', hex: '#991B1B' },
];

const PRESET_PASTEL = [
  { name: 'Soft Mint', hex: '#ECFDF5' },
  { name: 'Soft Sky', hex: '#F0F9FF' },
  { name: 'Soft Rose', hex: '#FFF1F2' },
  { name: 'Soft Peach', hex: '#FFF7ED' },
];

const DEFAULT_COLOR = PRESET_VIBRANT[0].hex;

// HSL / Hex conversion helpers for advanced color picker
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const ICON_PRESETS = [
  { name: 'Tag', icon: faTag, value: 'faTag' },
  { name: 'Flag', icon: faFlag, value: 'faFlag' },
  { name: 'Star', icon: faStar, value: 'faStar' },
  { name: 'Alert', icon: faExclamationTriangle, value: 'faExclamationTriangle' },
  { name: 'Bookmark', icon: faBookmark, value: 'faBookmark' },
  { name: 'Heart', icon: faHeart, value: 'faHeart' },
];

function getOpaqueColor(color?: string): string {
  if (!color) return '#475569';
  if (color.startsWith('#') && color.length > 7) {
    return color.substring(0, 7);
  }
  return color;
}

function getFontAwesomeIcon(iconName?: string) {
  switch (iconName) {
    case 'faFlag': return faFlag;
    case 'faStar': return faStar;
    case 'faExclamationTriangle': return faExclamationTriangle;
    case 'faBookmark': return faBookmark;
    case 'faHeart': return faHeart;
    default: return faTag;
  }
}

export function TagConfigPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<{ tag: Tag; isNew?: boolean; index?: number } | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState(DEFAULT_COLOR);
  const [editingHsl, setEditingHsl] = useState({ h: 240, s: 100, l: 50 });
  const [pickerTab, setPickerTab] = useState<'presets' | 'custom'>('presets');
  const [editingIcon, setEditingIcon] = useState('faTag');
  const [editingActive, setEditingActive] = useState(true);

  const handleHslChange = (h: number, s: number, l: number) => {
    setEditingHsl({ h, s, l });
    const hex = hslToHex(h, s, l);
    setEditingColor(hex);
  };
  
  const [deletingTag, setDeletingTag] = useState<{ index: number; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      // Fetch all tags (including inactive ones)
      const data = await tagApi.fetchTags(false);
      // Sort alphabetically by name
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setTags(sorted);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast('Failed to load tags.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sort before saving to maintain consistency
      const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));
      const saved = await tagApi.saveTags(sorted);
      setTags(saved.sort((a, b) => a.name.localeCompare(b.name)));
      toast('Tags saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save tags:', error);
      toast('Failed to save tags.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const newTag: Tag = {
      name: '',
      active: true,
      color: DEFAULT_COLOR,
      icon: 'faTag',
    };
    setEditingTag({ tag: newTag, isNew: true });
    setEditingName('');
    setEditingColor(DEFAULT_COLOR);
    setEditingHsl(hexToHsl(DEFAULT_COLOR));
    setPickerTab('presets');
    setEditingIcon('faTag');
    setEditingActive(true);
  };

  const handleEditTag = (tag: Tag, index: number) => {
    setEditingTag({ tag, isNew: false, index });
    setEditingName(tag.name);
    const col = getOpaqueColor(tag.color || DEFAULT_COLOR);
    setEditingColor(col);
    setEditingHsl(hexToHsl(col));
    setPickerTab('presets');
    setEditingIcon(tag.icon || 'faTag');
    setEditingActive(tag.active);
  };

  const handleDeleteClick = (tag: Tag, index: number) => {
    setDeletingTag({ index, name: tag.name });
  };

  const confirmDelete = () => {
    if (!deletingTag) return;
    const { index } = deletingTag;
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    setDeletingTag(null);
    toast('Tag removed from list (Save to persist changes)', 'success');
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingName.trim()) return;
    const { tag, isNew, index } = editingTag;
    
    // Check if name is unique (excluding self)
    const isDuplicate = tags.some((t, i) => 
      t.name.toLowerCase() === editingName.trim().toLowerCase() && 
      (!isNew && i !== index)
    );

    if (isDuplicate) {
      toast('A tag with this name already exists.', 'error');
      return;
    }

    const updatedTag: Tag = {
      ...tag,
      name: editingName.trim(),
      color: editingColor,
      icon: editingIcon,
      active: editingActive,
    };

    const newTags = [...tags];
    if (isNew) {
      newTags.push(updatedTag);
    } else if (index !== undefined) {
      newTags[index] = updatedTag;
    }

    // Keep list sorted alphabetically
    newTags.sort((a, b) => a.name.localeCompare(b.name));

    setTags(newTags);
    setEditingTag(null);
    setEditingName('');
  };

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tag Configuration</h1>
            <p className="text-sm text-foreground/40 mt-1">Manage tags used to categorize deals and accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddTag}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-all duration-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Tag</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      {/* Search Filter */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/30">
          <FontAwesomeIcon icon={faSearch} className="text-xs" />
        </div>
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl p-12 text-center text-foreground/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-xl text-foreground/20">
            <FontAwesomeIcon icon={faTag} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground/60 text-sm">No Tags Found</h3>
            <p className="text-xs text-foreground/40 mt-1 max-w-xs leading-normal">
              {searchQuery ? 'Try adjusting your search query.' : 'Click "Add Tag" to create your first tag configuration.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-1 pb-6">
          {filteredTags.map((tag, idx) => {
            const actualIndex = tags.findIndex(t => t === tag);
            const tagColor = getOpaqueColor(tag.color || '#475569');
            return (
              <div 
                key={tag.id || `tag-${idx}`}
                className="group relative bg-card border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] overflow-hidden"
              >
                {/* Visual accent background: subtle gradient matching tag color */}
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"
                  style={{ 
                    background: `linear-gradient(135deg, ${tagColor} 0%, transparent 100%)` 
                  }}
                />

                {/* Top Section: Icon & Active State */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-black/5 shadow-sm"
                    style={{ backgroundColor: `${tagColor}15`, color: tagColor }}
                  >
                    <FontAwesomeIcon icon={getFontAwesomeIcon(tag.icon)} className="text-sm" />
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tag.active 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-muted text-foreground/45 border border-border'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tag.active ? 'bg-emerald-500' : 'bg-foreground/30'}`} />
                    {tag.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Center Section: Tag Name Badge Preview */}
                <div className="my-3 relative z-10 flex">
                  <span 
                    className="inline-flex items-center gap-2 font-bold text-xs px-3.5 py-1.5 rounded-full border shadow-sm"
                    style={{ 
                      backgroundColor: `${tagColor}08`, 
                      borderColor: `${tagColor}25`, 
                      color: tagColor 
                    }}
                  >
                    <FontAwesomeIcon icon={getFontAwesomeIcon(tag.icon)} className="text-[10px] opacity-70" />
                    {tag.name}
                  </span>
                </div>

                {/* Bottom Section: Metadata & Quick Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 relative z-10">
                  <span className="text-[10px] font-mono text-foreground/35 uppercase">
                    Color: {tagColor.toUpperCase()}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditTag(tag, actualIndex)}
                      className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/45 flex items-center justify-center text-xs transition-all cursor-pointer border border-transparent hover:border-primary/10"
                      title="Edit Tag"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tag, actualIndex)}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground/45 flex items-center justify-center text-xs transition-all cursor-pointer border border-transparent hover:border-destructive/10"
                      title="Delete Tag"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">
              {editingTag.isNew ? 'Create New Tag' : 'Edit Tag Configuration'}
            </h3>

            {/* Live Tag Preview Badge */}
            <div className="flex items-center justify-center p-4 bg-muted/20 border border-border rounded-2xl mb-4 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ 
                  background: `linear-gradient(135deg, ${editingColor} 0%, transparent 100%)` 
                }}
              />
              <span 
                className="inline-flex items-center gap-2 font-bold text-xs px-3.5 py-1.5 rounded-full border shadow-sm relative z-10"
                style={{ 
                  backgroundColor: `${editingColor}08`, 
                  borderColor: `${editingColor}25`, 
                  color: editingColor 
                }}
              >
                <FontAwesomeIcon icon={getFontAwesomeIcon(editingIcon)} className="text-[10px]" />
                {editingName.trim() || 'PREVIEW'}
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                  Tag Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hot Lead"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all bg-card"
                  autoFocus
                />
              </div>

              {/* Color Theme (Advanced Picker) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Color Theme
                  </label>
                  <div className="flex rounded-lg bg-muted/40 p-0.5 border border-border text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPickerTab('presets')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        pickerTab === 'presets' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab('custom')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        pickerTab === 'custom' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50'
                      }`}
                    >
                      Custom (HSL)
                    </button>
                  </div>
                </div>

                {pickerTab === 'presets' ? (
                  <div className="space-y-3 p-3 bg-muted/10 border border-border rounded-2xl">
                    {/* Vibrant Group */}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/30 block mb-1">Vibrant</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_VIBRANT.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              setEditingColor(preset.hex);
                              setEditingHsl(hexToHsl(preset.hex));
                            }}
                            className={`w-6.5 h-6.5 rounded-full border transition-all relative ${
                              editingColor.toUpperCase() === preset.hex.toUpperCase() ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-black/5 scale-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Muted Group */}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/30 block mb-1">Muted / Dark</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_MUTED.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              setEditingColor(preset.hex);
                              setEditingHsl(hexToHsl(preset.hex));
                            }}
                            className={`w-6.5 h-6.5 rounded-full border transition-all relative ${
                              editingColor.toUpperCase() === preset.hex.toUpperCase() ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-black/5 scale-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Pastel Group */}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/30 block mb-1">Pastel</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_PASTEL.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              setEditingColor(preset.hex);
                              setEditingHsl(hexToHsl(preset.hex));
                            }}
                            className={`w-6.5 h-6.5 rounded-full border transition-all relative ${
                              editingColor.toUpperCase() === preset.hex.toUpperCase() ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-black/5 scale-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 bg-muted/10 p-4 border border-border rounded-2xl">
                    {/* Hue */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-foreground/50 mb-1">
                        <span>HUE ({editingHsl.h}°)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={editingHsl.h}
                        onChange={(e) => {
                          const h = parseInt(e.target.value);
                          handleHslChange(h, editingHsl.s, editingHsl.l);
                        }}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer border border-black/5 shadow-inner"
                        style={{
                          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                        }}
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-foreground/50 mb-1">
                        <span>SATURATION ({editingHsl.s}%)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingHsl.s}
                        onChange={(e) => {
                          const s = parseInt(e.target.value);
                          handleHslChange(editingHsl.h, s, editingHsl.l);
                        }}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer border border-black/5 shadow-inner"
                        style={{
                          background: `linear-gradient(to right, hsl(${editingHsl.h}, 0%, ${editingHsl.l}%), hsl(${editingHsl.h}, 100%, ${editingHsl.l}%))`
                        }}
                      />
                    </div>

                    {/* Lightness */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-foreground/50 mb-1">
                        <span>LIGHTNESS ({editingHsl.l}%)</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={editingHsl.l}
                        onChange={(e) => {
                          const l = parseInt(e.target.value);
                          handleHslChange(editingHsl.h, editingHsl.s, l);
                        }}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer border border-black/5 shadow-inner"
                        style={{
                          background: `linear-gradient(to right, #000000, hsl(${editingHsl.h}, ${editingHsl.s}%, 50%), #ffffff)`
                        }}
                      />
                    </div>

                    {/* Manual Hex Input */}
                    <div className="flex items-center gap-2 pt-2.5 border-t border-border/40">
                      <span className="text-[10px] font-bold text-foreground/50">HEX CODE:</span>
                      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-lg shadow-sm">
                        <input
                          type="text"
                          value={editingColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingColor(val);
                            if (/^#[0-9A-F]{6}$/i.test(val)) {
                              setEditingHsl(hexToHsl(val));
                            }
                          }}
                          className="flex-1 bg-transparent border-none p-0 text-xs font-mono uppercase focus:outline-none focus:ring-0"
                          placeholder="#FFFFFF"
                        />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: editingColor }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                  Icon
                </label>
                <div className="flex gap-2">
                  {ICON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setEditingIcon(preset.value)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-all ${
                        editingIcon === preset.value
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border hover:bg-muted text-foreground/45'
                      }`}
                      title={preset.name}
                    >
                      <FontAwesomeIcon icon={preset.icon} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between py-2 border-t border-border/40 mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Active Tag</span>
                  <span className="text-xs text-foreground/40">Inactive tags won't appear in lead creation filters</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingActive}
                    onChange={(e) => setEditingActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTag}
                disabled={!editingName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground disabled:bg-primary/50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {editingTag.isNew ? 'Create' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border/85 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-destructive mb-2">Delete Tag</h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-foreground">"{deletingTag.name}"</strong>? This will remove the tag config. You must click <strong>Save Changes</strong> afterwards to persist this deletion to the database.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingTag(null)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
