import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPlus, 
  faTrash, 
  faEdit, 
  faMagnifyingGlass, 
  faFileLines,
  faCheck,
  faTimes,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';
import { useToast } from '@/shared/ui/toast/ToastProvider';

export interface Template {
  id: number;
  name: string;
  subject: string;
  category: 'Email' | 'SMS' | 'WhatsApp';
  content: string;
  active: boolean;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Welcome Onboarding Email',
    subject: 'Welcome to Propela CRM!',
    category: 'Email',
    content: 'Hi {{contact_name}},\n\nWelcome to Propela! We are thrilled to have you onboard. If you need any assistance getting started, feel free to reply to this email.\n\nBest regards,\nThe Propela Team',
    active: true,
  },
  {
    id: 2,
    name: 'Follow Up SMS',
    subject: 'Meeting Follow Up',
    category: 'SMS',
    content: 'Hi {{contact_name}}, thanks for your time today. Let me know if you have any questions. - Propela CRM',
    active: true,
  },
  {
    id: 3,
    name: 'WhatsApp Proposal Sharing',
    subject: 'Project Proposal',
    category: 'WhatsApp',
    content: 'Hello {{contact_name}}, here is the proposal for your review: {{proposal_link}}. Let me know what you think!',
    active: true,
  },
  {
    id: 4,
    name: 'Meeting Confirmation Email',
    subject: 'Meeting Confirmed: {{event_name}}',
    category: 'Email',
    content: 'Hi {{contact_name}},\n\nThis is to confirm our upcoming meeting for {{event_name}} scheduled on {{event_date}} at {{event_time}}.\n\nLooking forward to speaking with you.\n\nBest,\n{{agent_name}}',
    active: false,
  }
];

export function TemplatesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTemplate = () => {
    setEditingTemplate({
      name: '',
      subject: '',
      category: 'Email',
      content: '',
      active: true,
    });
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate({ ...template });
  };

  const handleDeleteClick = (template: Template) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = () => {
    if (!deletingTemplate) return;
    setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id));
    toast('Template deleted successfully', 'success');
    setDeletingTemplate(null);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name?.trim() || !editingTemplate.content?.trim()) {
      toast('Please fill in all mandatory fields', 'error');
      return;
    }

    if (editingTemplate.category === 'Email' && !editingTemplate.subject?.trim()) {
      toast('Subject is required for Email templates', 'error');
      return;
    }

    if (editingTemplate.id !== undefined) {
      // Editing existing
      setTemplates(prev => 
        prev.map(t => t.id === editingTemplate.id ? (editingTemplate as Template) : t)
      );
      toast('Template updated successfully', 'success');
    } else {
      // Adding new
      const newTemplate: Template = {
        id: templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1,
        name: editingTemplate.name || '',
        subject: editingTemplate.subject || '',
        category: editingTemplate.category || 'Email',
        content: editingTemplate.content || '',
        active: editingTemplate.active !== undefined ? editingTemplate.active : true,
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast('Template created successfully', 'success');
    }

    setEditingTemplate(null);
  };

  const handleToggleStatus = (template: Template) => {
    setTemplates(prev =>
      prev.map(t => t.id === template.id ? { ...t, active: !t.active } : t)
    );
    toast(`Template set to ${!template.active ? 'Active' : 'Inactive'}`, 'success');
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<Template>[] = [
    {
      key: 'name',
      header: 'Template Name',
      width: '25%',
      render: (template) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground/80">{template.name}</span>
          <span className="text-xs text-foreground/40 max-w-[200px] truncate">
            {template.content}
          </span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject / Description',
      width: '30%',
      render: (template) => (
        <span className="text-sm text-foreground/60">
          {template.category === 'Email' ? template.subject : '(No subject required)'}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: '15%',
      render: (template) => {
        const bgColors = {
          Email: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
          SMS: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
          WhatsApp: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${bgColors[template.category]}`}>
            {template.category}
          </span>
        );
      }
    },
    {
      key: 'active',
      header: 'Status',
      width: '15%',
      render: (template) => (
        <button
          onClick={() => handleToggleStatus(template)}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
            template.active 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20' 
              : 'bg-gray-500/10 border-gray-500/20 text-gray-500 hover:bg-gray-500/20'
          }`}
          title="Click to toggle status"
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            template.active ? 'bg-emerald-500' : 'bg-gray-500'
          }`} />
          {template.active ? 'ACTIVE' : 'INACTIVE'}
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
            className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/40 flex items-center justify-center transition-all"
            title="Edit Template"
          >
            <FontAwesomeIcon icon={faEdit} className="text-xs" />
          </button>
          <button 
            onClick={() => handleDeleteClick(template)}
            className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground/40 flex items-center justify-center transition-all"
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
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors text-foreground/60"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Template Configuration</h1>
            <p className="text-sm text-foreground/40 mt-1">Manage standard communication templates</p>
          </div>
        </div>

        <button 
          onClick={handleAddTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300 font-semibold text-sm shadow-lg shadow-primary/10"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Template</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-card/30 rounded-3xl border border-border/50 flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
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

      {/* Add / Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingTemplate.id !== undefined ? 'Edit Template' : 'Add New Template'}
              </h3>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted text-foreground/40 flex items-center justify-center transition-all"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Category</label>
                <div className="flex gap-2">
                  {(['Email', 'SMS', 'WhatsApp'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setEditingTemplate(prev => prev ? { ...prev, category: cat } : null)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        editingTemplate.category === cat
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/50 border-border/50 text-foreground/60 hover:bg-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Name */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Template Name</label>
                  <span className="text-[10px] text-destructive font-bold uppercase tracking-widest">Mandatory</span>
                </div>
                <input 
                  type="text"
                  required
                  value={editingTemplate.name || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g. Lead Welcome Mail"
                  className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 text-foreground transition-all outline-none text-sm"
                />
              </div>

              {/* Subject (only for Email) */}
              {editingTemplate.category === 'Email' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Subject</label>
                    <span className="text-[10px] text-destructive font-bold uppercase tracking-widest">Mandatory</span>
                  </div>
                  <input 
                    type="text"
                    required={editingTemplate.category === 'Email'}
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    placeholder="Enter email subject line..."
                    className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 text-foreground transition-all outline-none text-sm"
                  />
                </div>
              )}

              {/* Template Content */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Content</label>
                  <span className="text-[10px] text-destructive font-bold uppercase tracking-widest">Mandatory</span>
                </div>
                <textarea 
                  required
                  rows={5}
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Use tags like {{contact_name}} for dynamic values..."
                  className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 text-foreground transition-all outline-none text-sm font-sans"
                />
                <span className="text-[11px] text-foreground/30">
                  Tip: Use double curly braces like <strong>{`{{contact_name}}`}</strong>, <strong>{`{{agent_name}}`}</strong> or <strong>{`{{proposal_link}}`}</strong>.
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="active"
                  checked={editingTemplate.active || false}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, active: e.target.checked } : null)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm text-foreground/60 select-none cursor-pointer font-semibold">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 py-3 rounded-xl hover:bg-muted font-semibold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
