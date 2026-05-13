import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, type ProductEntity } from '../api/productApi';
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
  faCloudUploadAlt,
  faTrashAlt,
  faChevronRight,
  faDownload
} from '@fortawesome/free-solid-svg-icons';

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

export function AddEditProductPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(!!code);
  const [product, setProduct] = useState<Partial<ProductEntity>>({
    name: '',
    isActive: true,
    tempActive: true,
  });

  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (code) {
      fetchProduct();
    }
    fetchTemplates();
  }, [code]);

  const fetchProduct = async () => {
    try {
      const data = await productApi.fetchProductByCode(code!);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast('Failed to load product details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await productApi.fetchProductTemplates({ size: 100 });
      setTemplates(data.content || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleUpdateNext = async () => {
    if (!product.name) {
      toast('Product name is required', 'error');
      return;
    }

    try {
      if (product.id) {
        await productApi.updateProduct(product.id, {
          name: product.name,
          productTemplateId: product.productTemplateId,
        });
        toast('Basic information updated', 'success');
        setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast('Failed to update product', 'error');
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
    <div className="flex-1 flex flex-col min-h-0 space-y-2 max-w-1xl mx-auto w-full pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foreground/40 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/products')}>Products</span>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-foreground/20" />
        <span className="text-foreground/80 font-medium">{code ? 'Edit Product' : 'Add Product'}</span>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-900">General information</h3>
          <p className="text-sm text-amber-800/60 leading-relaxed">
            Add your products or services and connect them to a custom sales pipeline template. Each template includes predefined stages and statuses tailored to your sales process for accurate deal tracking.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${activeStep === index
                ? 'bg-foreground text-background shadow-lg shadow-foreground/20 scale-105'
                : 'bg-card border border-border/50 text-foreground/40 hover:bg-muted'
                }`}
            >
              <FontAwesomeIcon icon={step.icon} className="text-xs" />
              <span className="text-xs font-bold whitespace-nowrap">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className="w-4 h-[1px] bg-border/30" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden p-6">
        {activeStep === 0 && (
          <div className="max-w-2xl space-y-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter Product Name"
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                  Product Description
                </label>
                <textarea
                  value={product.description || ''}
                  onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter Product Description"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                  Selected Template
                </label>
                <div className="relative group">
                  <select
                    value={typeof product.productTemplateId === 'object' ? product.productTemplateId?.id : product.productTemplateId || ''}
                    onChange={(e) => setProduct(prev => ({
                      ...prev,
                      productTemplateId: Number(e.target.value)
                    }))}
                    className="w-full px-4 py-3 rounded-xl bg-muted/10 border border-border/50 appearance-none text-sm font-medium focus:outline-none cursor-not-allowed opacity-80"
                    disabled
                  >
                    <option value="">Select Template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/20">
                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                  </div>
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    Product logo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-foreground/20 overflow-hidden shrink-0">
                      {product.logoFileDetail?.url ? (
                        <img src={`https://dev.leadzump.ai/${product.logoFileDetail.url}`} className="w-full h-full object-contain" />
                      ) : (
                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/70 truncate">{product.logoFileDetail?.name || 'No file chosen'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg text-primary hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      </button>
                      <button className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                        <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    Product banner image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-foreground/20 overflow-hidden shrink-0">
                      {product.bannerFileDetail?.url ? (
                        <img src={`https://dev.leadzump.ai/${product.bannerFileDetail.url}`} className="w-full h-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/70 truncate">{product.bannerFileDetail?.name || 'No file chosen'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg text-primary hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      </button>
                      <button className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                        <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateNext}
              className="px-8 py-3 rounded-xl bg-foreground text-background text-sm font-bold shadow-xl shadow-foreground/10 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Update & Next
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
              className="text-sm font-bold text-primary hover:underline mt-4"
            >
              Back to Basic information
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Missing icon
const faLock = faLink; // Temporary fallback if faLock is not imported correctly or not available
