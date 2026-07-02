import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPlus, 
  faTrash, 
  faGripVertical, 
  faSave, 
  faChevronRight, 
  faChevronDown,
  faEdit,
  faCheck,
  faTimes,
  faSitemap
} from '@fortawesome/free-solid-svg-icons';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { sourceApi, type Source } from '../api/sourceApi';

interface SortableItemProps {
  id: string;
  source: Source;
  onEdit: (source: Source) => void;
  onDelete: () => void;
  onAddChild?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  level: number;
}

function SortableSourceItem({ 
  id, 
  source, 
  onEdit, 
  onDelete, 
  onAddChild, 
  isExpanded, 
  onToggleExpand,
  level 
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    marginLeft: `${level * 24}px`
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 mb-2
        ${isDragging ? 'bg-primary/5 border-primary shadow-xl scale-[1.02] opacity-50' : 'bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-foreground/20 hover:text-primary transition-colors"
      >
        <FontAwesomeIcon icon={faGripVertical} />
      </div>

      {onToggleExpand && (
        <button 
          onClick={onToggleExpand}
          className="w-6 h-6 flex items-center justify-center text-foreground/40 hover:text-primary transition-colors"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
        </button>
      )}

      <div className="flex-1 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/40'}`}>
          <FontAwesomeIcon icon={level === 0 ? faSitemap : faPlus} className="text-xs" />
        </div>
        <span className="font-medium text-foreground">{source.name}</span>
        {!source.active && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-muted text-foreground/40 rounded-full uppercase tracking-wider">Inactive</span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddChild && (
          <button 
            onClick={onAddChild}
            className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/40 transition-all"
            title="Add Sub-Source"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        )}
        <button 
          onClick={() => onEdit(source)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/40 transition-all"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button 
          onClick={onDelete}
          className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground/40 transition-all"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}

export function SourceConfigPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingSource, setEditingSource] = useState<{ source: Source; parentId?: string; isNew?: boolean } | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingSource, setDeletingSource] = useState<{ index: number; childIndex?: number; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const data = await sourceApi.fetchSources();
      setSources(data);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
      toast('Failed to load sources.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Logic for reordering top-level sources
    // For simplicity, we only allow reordering within the same level
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.includes('-') && overId.includes('-')) {
      // Sub-source reordering
      const [parentIndexStr] = activeId.split('-');
      const parentIndex = parseInt(parentIndexStr);
      
      const newSources = [...sources];
      const children = newSources[parentIndex].children;
      const oldIndex = children.findIndex((_, idx) => `${parentIndex}-${idx}` === activeId);
      const newIndex = children.findIndex((_, idx) => `${parentIndex}-${idx}` === overId);
      
      newSources[parentIndex].children = arrayMove(children, oldIndex, newIndex);
      // Update display orders
      newSources[parentIndex].children.forEach((child, idx) => {
        child.displayOrder = idx;
      });
      setSources(newSources);
    } else if (!activeId.includes('-') && !overId.includes('-')) {
      // Top-level reordering
      const oldIndex = sources.findIndex((_, idx) => idx.toString() === activeId);
      const newIndex = sources.findIndex((_, idx) => idx.toString() === overId);
      
      const newSources = arrayMove(sources, oldIndex, newIndex);
      // Update display orders
      newSources.forEach((source, idx) => {
        source.displayOrder = idx;
      });
      setSources(newSources);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await sourceApi.saveSources(sources);
      toast('Sources saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save sources:', error);
      toast('Failed to save sources.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSource = () => {
    const newSource: Source = {
      name: '',
      displayOrder: sources.length,
      active: true,
      children: []
    };
    setEditingSource({ source: newSource, isNew: true });
    setEditingName('');
  };

  const handleAddSubSource = (parentIndex: number) => {
    const newSubSource: Source = {
      name: '',
      displayOrder: sources[parentIndex].children.length,
      active: true,
      children: []
    };
    setEditingSource({ 
      source: newSubSource, 
      parentId: parentIndex.toString(), 
      isNew: true 
    });
    setEditingName('');
  };

  const handleDeleteSource = (index: number) => {
    setDeletingSource({ index, name: sources[index].name });
  };

  const handleDeleteSubSource = (parentIndex: number, childIndex: number) => {
    setDeletingSource({ 
      index: parentIndex, 
      childIndex, 
      name: sources[parentIndex].children[childIndex].name 
    });
  };

  const confirmDelete = () => {
    if (!deletingSource) return;
    const { index, childIndex } = deletingSource;
    
    const newSources = [...sources];
    if (childIndex !== undefined) {
      newSources[index].children = newSources[index].children.filter((_, i) => i !== childIndex);
    } else {
      newSources.splice(index, 1);
    }
    setSources(newSources);
    setDeletingSource(null);
    toast('Item deleted successfully', 'success');
  };

  const handleUpdateSourceName = (newName: string) => {
    if (!editingSource || !newName.trim()) return;
    const { source, parentId, isNew } = editingSource;
    
    const newSources = [...sources];
    if (isNew) {
      if (parentId !== undefined) {
        const pIdx = parseInt(parentId);
        // Create a copy of the parent to avoid direct mutation
        newSources[pIdx] = {
          ...newSources[pIdx],
          children: [...newSources[pIdx].children, { ...source, name: newName }]
        };
        // Auto expand parent
        const newExpanded = new Set(expandedIds);
        newExpanded.add(parentId);
        setExpandedIds(newExpanded);
      } else {
        newSources.push({ ...source, name: newName });
      }
    } else {
      if (parentId !== undefined) {
        const pIdx = parseInt(parentId);
        const childIdx = newSources[pIdx].children.findIndex(c => c === source);
        if (childIdx !== -1) {
          const newChildren = [...newSources[pIdx].children];
          newChildren[childIdx] = { ...newChildren[childIdx], name: newName };
          newSources[pIdx] = { ...newSources[pIdx], children: newChildren };
        }
      } else {
        const sIdx = newSources.findIndex(s => s === source);
        if (sIdx !== -1) {
          newSources[sIdx] = { ...newSources[sIdx], name: newName };
        }
      }
    }
    setSources(newSources);
    setEditingSource(null);
    setEditingName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Source Configuration</h1>
            <p className="text-sm text-foreground/40 mt-1">Manage lead sources and their categories</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddSource}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold text-sm"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Source</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/20
              ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faSave} />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      {}
      <div className="flex-1 min-h-0 bg-card rounded-3xl border border-border p-8 shadow-sm overflow-y-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sources.map((_, i) => i.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-w-4xl mx-auto">
              {sources.map((source, index) => {
                const sourceId = index.toString();
                const isExpanded = expandedIds.has(sourceId);

                return (
                  <div key={sourceId} className="mb-4">
                    <SortableSourceItem 
                      id={sourceId}
                      source={source}
                      level={0}
                      onEdit={(s) => {
                        setEditingSource({ source: s });
                        setEditingName(s.name);
                      }}
                      onDelete={() => handleDeleteSource(index)}
                      onAddChild={() => handleAddSubSource(index)}
                      isExpanded={isExpanded}
                      onToggleExpand={() => handleToggleExpand(sourceId)}
                    />
                    
                    {isExpanded && (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <SortableContext 
                          items={source.children.map((_, ci) => `${sourceId}-${ci}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {source.children.map((child, childIndex) => (
                            <SortableSourceItem 
                              key={`${sourceId}-${childIndex}`}
                              id={`${sourceId}-${childIndex}`}
                              source={child}
                              level={1}
                              onEdit={(s) => {
                                setEditingSource({ source: s, parentId: sourceId });
                                setEditingName(s.name);
                              }}
                              onDelete={() => handleDeleteSubSource(index, childIndex)}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    )}
                  </div>
                );
              })}

              {sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center text-3xl mb-6">
                    <FontAwesomeIcon icon={faSitemap} />
                  </div>
                  <h3 className="text-xl font-bold">No Sources Configured</h3>
                  <p className="mt-2">Click "Add Source" to start building your hierarchy.</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6">
              {editingSource.isNew ? 'Add' : 'Edit'} {editingSource.parentId ? 'Sub-Source' : 'Source'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Name</label>
                  <span className="text-[10px] text-destructive font-bold uppercase tracking-widest">Mandatory</span>
                </div>
                <input 
                  type="text"
                  value={editingName}
                  placeholder="Enter name..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 text-foreground transition-all outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateSourceName(editingName);
                    }
                  }}
                  onChange={(e) => setEditingName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button 
                  onClick={() => {
                    setEditingSource(null);
                    setEditingName('');
                  }}
                  className="flex-1 py-3 rounded-xl hover:bg-muted font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!editingName.trim()}
                  onClick={() => handleUpdateSourceName(editingName)}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editingSource.isNew ? 'Add' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center text-2xl mb-6 mx-auto">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Delete {deletingSource.childIndex !== undefined ? 'Sub-Source' : 'Source'}?</h3>
            <p className="text-sm text-foreground/50 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-foreground">"{deletingSource.name}"</span>? 
              {deletingSource.childIndex === undefined && " All sub-sources will also be removed."}
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDeletingSource(null)}
                className="flex-1 py-3 rounded-xl hover:bg-muted font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all"
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
