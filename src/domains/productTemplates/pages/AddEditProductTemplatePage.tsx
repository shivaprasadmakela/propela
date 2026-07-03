import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faCircleNodes,
  faFolderOpen,
  faLink,
  faBullhorn,
  faUserPlus,
  faEye,
  faCopy,
  faClockRotateLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { templateApi, type ProductTemplate } from '../api/templateApi';

const STEPS = [
  { id: 'basic', label: 'Basic information', icon: faCircleInfo },
  { id: 'flow', label: 'Deal Flow Management', icon: faCircleNodes },
  { id: 'assets', label: 'Asset management', icon: faFolderOpen },
  { id: 'webhooks', label: "Webhook URL's", icon: faLink },
  { id: 'campaigns', label: 'Campaigns', icon: faBullhorn },
  { id: 'walkin', label: 'Walk-in form', icon: faUserPlus },
  { id: 'visibility', label: 'Data visibility', icon: faEye },
  { id: 'duplicate', label: 'Duplicate Deal Rule', icon: faCopy },
  { id: 'expiry', label: 'Deal expiry', icon: faClockRotateLeft },
];

export function AddEditProductTemplatePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(!!code);
  const [template, setTemplate] = useState<Partial<ProductTemplate>>({
    name: '',
    description: '',
    productTemplateType: 'GENERAL',
    isActive: true,
  });

  useEffect(() => {
    if (code) {
      fetchTemplate();
    }
  }, [code]);

  const fetchTemplate = async () => {
    try {
      const data = await templateApi.fetchTemplateByCode(code!);
      setTemplate(data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast('Failed to load template details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNext = async () => {
    if (!template.name?.trim()) {
      toast('Template name is required', 'error');
      return;
    }
    if (!template.description?.trim()) {
      toast('Template description is required', 'error');
      return;
    }

    try {
      if (template.id !== undefined) {
        // Update template
        const updated = await templateApi.updateTemplate(template.id, {
          name: template.name.trim(),
          description: template.description.trim(),
          productTemplateType: template.productTemplateType || 'GENERAL',
          isActive: template.isActive
        });
        setTemplate(updated);
        toast('Basic information updated', 'success');
        setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
      } else {
        // Create template
        const created = await templateApi.createTemplate({
          name: template.name.trim(),
          description: template.description.trim(),
          productTemplateType: 'GENERAL',
          isActive: template.isActive ?? true
        });
        setTemplate(created);
        toast('Template created successfully', 'success');
        // Navigate to the edit path for the newly created template so code is in URL
        navigate(`/addProductTemplate/${created.code}`, { replace: true });
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast('Failed to save template', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 w-full pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span 
          className="text-foreground/40 cursor-pointer hover:text-primary transition-colors" 
          onClick={() => navigate('/productTemplates')}
        >
          Product Templates
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-foreground/20" />
        <span className="text-foreground/80 font-medium">{code ? 'Edit Template' : 'Add Template'}</span>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-900">General information</h3>
          <p className="text-xs text-amber-800/70 leading-relaxed">
            Configure product template level properties. Product templates hold pipeline stages, walk-in forms, expiry rules, and visibility rules that are inherited by all products created under them.
          </p>
        </div>
      </div>

      {/* Side-by-Side Configuration Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible py-2 lg:py-0 no-scrollbar">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 shrink-0 cursor-pointer ${
                activeStep === index
                  ? 'bg-foreground text-background shadow-md shadow-foreground/5 font-semibold'
                  : 'bg-card border border-border text-foreground/50 hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={step.icon} className="text-xs shrink-0" />
              <span className="text-xs whitespace-nowrap lg:whitespace-normal font-semibold leading-tight">{step.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Tab Content Panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-3xl shadow-sm overflow-hidden p-6 lg:p-8 min-h-[500px]">
          {activeStep === 0 && (
            <div className="max-w-2xl space-y-8">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={template.name || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter Template Name (e.g. ResidentialTemplate)"
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    Template Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={template.description || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose/scope of this template..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    Template Type
                  </label>
                  <input
                    type="text"
                    value={template.productTemplateType || 'GENERAL'}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-muted/10 border border-border text-foreground/50 outline-none text-sm cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={template.isActive ?? true}
                    onChange={(e) => setTemplate(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="template-active" className="text-sm text-foreground/60 select-none cursor-pointer font-semibold">
                    Active
                  </label>
                </div>
              </div>

              <button
                onClick={handleUpdateNext}
                className="px-8 py-3 rounded-xl bg-foreground text-background text-sm font-bold shadow-xl shadow-foreground/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                Save & Continue
              </button>
            </div>
          )}

          {activeStep > 0 && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-foreground/20">
                <FontAwesomeIcon icon={STEPS[activeStep].icon} size="2x" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground/80">{STEPS[activeStep].label}</h3>
                <p className="text-sm text-foreground/40 mt-1">Section coming soon...</p>
              </div>
              <button
                onClick={() => setActiveStep(prev => prev - 1)}
                className="text-sm font-bold text-primary hover:underline mt-4 cursor-pointer"
              >
                Back to previous section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
