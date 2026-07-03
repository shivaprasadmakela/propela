import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPlus, 
  faTrash, 
  faEdit, 
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { templateApi, type ProductTemplate } from '../api/templateApi';

export function ProductTemplatesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingTemplate, setDeletingTemplate] = useState<ProductTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await templateApi.fetchTemplates();
      setTemplates(response.content || []);
    } catch (error) {
      console.error('Failed to fetch product templates:', error);
      toast('Failed to load templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTemplate = () => {
    navigate('/addProductTemplate');
  };

  const handleEditTemplate = (template: ProductTemplate) => {
    navigate(`/addProductTemplate/${template.code}`);
  };

  const handleDeleteClick = (template: ProductTemplate) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate || deletingTemplate.id === undefined) return;
    try {
      await templateApi.deleteTemplate(deletingTemplate.id);
      setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id));
      toast('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast('Failed to delete template.', 'error');
    } finally {
      setDeletingTemplate(null);
    }
  };

  const handleToggleStatus = async (template: ProductTemplate) => {
    if (template.id === undefined) return;
    try {
      const updatedStatus = !template.isActive;
      const updated = await templateApi.updateTemplate(template.id, {
        isActive: updatedStatus
      });
      setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
      toast(`Template set to ${updatedStatus ? 'Active' : 'Inactive'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle template status:', error);
      toast('Failed to update template status.', 'error');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.productTemplateType.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<ProductTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      width: '30%',
      render: (template) => (
        <span className="text-sm font-semibold text-foreground/80">{template.name}</span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: '35%',
      render: (template) => (
        <span className="text-sm text-foreground/60 block truncate max-w-sm">
          {template.description || '-'}
        </span>
      )
    },
    {
      key: 'productTemplateType',
      header: 'Type',
      width: '10%',
      render: (template) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
          {template.productTemplateType}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '10%',
      render: (template) => (
        <button
          onClick={() => handleToggleStatus(template)}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
            template.isActive 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20' 
              : 'bg-gray-500/10 border-gray-500/20 text-gray-500 hover:bg-gray-500/20'
          }`}
          title="Click to toggle status"
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            template.isActive ? 'bg-emerald-500' : 'bg-gray-500'
          }`} />
          {template.isActive ? 'ACTIVE' : 'INACTIVE'}
        </button>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      width: '15%',
      render: (template) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleEditTemplate(template)}
            className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/45 flex items-center justify-center transition-all cursor-pointer"
            title="Edit Template"
          >
            <FontAwesomeIcon icon={faEdit} className="text-xs" />
          </button>
          <button 
            onClick={() => handleDeleteClick(template)}
            className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground/45 flex items-center justify-center transition-all cursor-pointer"
            title="Delete Template"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground/60 cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Templates</h1>
            <p className="text-sm text-foreground/40 mt-1">Manage product classification templates</p>
          </div>
        </div>

        <button 
          onClick={handleAddTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300 font-semibold text-sm shadow-lg shadow-primary/10 cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Template</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-card rounded-3xl border border-border flex flex-col overflow-hidden shadow-sm">
        {/* Search Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          <DataTable
            data={filteredTemplates}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No templates found. Add a template to get started."
            showSerialNumber={true}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center text-2xl mb-6 mx-auto">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-foreground">Delete Template?</h3>
            <p className="text-sm text-foreground/50 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-foreground">"{deletingTemplate.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDeletingTemplate(null)}
                className="flex-1 py-3 rounded-xl hover:bg-muted font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all cursor-pointer"
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
