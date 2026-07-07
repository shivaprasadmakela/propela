import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSpinner, faCheck, faFileExcel, faFileCsv } from '@fortawesome/free-solid-svg-icons';

interface DownloadDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFetchData: () => Promise<DealEntity[]>;
}

const AVAILABLE_COLUMNS = [
  { key: 'id', label: 'Deal ID' },
  { key: 'name', label: 'Deal Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'campaign_name', label: 'Campaign Name' },
  { key: 'assignedUser', label: 'Assigned User' },
  { key: 'stage', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'subSource', label: 'Sub Source' },
  { key: 'tag', label: 'Tag' },
  { key: 'product', label: 'Product' },
  { key: 'createdAt', label: 'Created On' },
];

export function DownloadDealsModal({ isOpen, onClose, onFetchData }: DownloadDealsModalProps) {
  const [filename, setFilename] = useState('deals');
  const [fileType, setFileType] = useState<'XLSX' | 'CSV'>('XLSX');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(col => col.key)
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setFilename('deals');
      setFileType('XLSX');
      setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.key));
      setIsDownloading(false);
    }
  }, [isOpen]);

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.key));
  };

  const handleClearAll = () => {
    setSelectedColumns([]);
  };

  const flattenDeal = (deal: DealEntity, selectedKeys: string[]): Record<string, string | number | boolean> => {
    const flatObj: Record<string, string | number | boolean> = {};

    selectedKeys.forEach(key => {
      switch (key) {
        case 'id':
          flatObj.id = deal.id;
          break;
        case 'name':
          flatObj.name = deal.name || '';
          break;
        case 'firstName':
          flatObj.firstName = deal.firstName || '';
          break;
        case 'lastName':
          flatObj.lastName = deal.lastName || '';
          break;
        case 'campaign_name':
          flatObj.campaign_name = deal.campaign_name || '';
          break;
        case 'assignedUser':
          flatObj.assignedUser = deal.assignedUserId
            ? `${deal.assignedUserId.firstName || ''} ${deal.assignedUserId.lastName || ''}`.trim()
            : '';
          break;
        case 'stage':
          flatObj.stage = deal.stage?.name || '';
          break;
        case 'status':
          flatObj.status = deal.status?.name || 'Open';
          break;
        case 'source':
          flatObj.source = deal.source || '';
          break;
        case 'subSource':
          flatObj.subSource = deal.subSource || '';
          break;
        case 'tag':
          flatObj.tag = deal.tag || '';
          break;
        case 'product':
          flatObj.product = deal.productId?.name || '';
          break;
        case 'createdAt':
          flatObj.createdAt = deal.createdAt
            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(deal.createdAt * 1000))
            : '';
          break;
        default:
          flatObj[key] = (deal as unknown as Record<string, string | number | boolean>)[key] ?? '';
      }
    });

    return flatObj;
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColumns.length === 0) {
      toast('Please select at least one column to download', 'error');
      return;
    }

    setIsDownloading(true);
    try {
      // 1. Fetch matching data
      const rawData = await onFetchData();
      if (rawData.length === 0) {
        toast('No data available to download', 'info');
        setIsDownloading(false);
        return;
      }

      // 2. Flatten raw data according to selected columns
      const dataToExport = rawData.map(deal => flattenDeal(deal, selectedColumns));

      // 3. Prepare payload for spreadsheet generator
      const cleanFilename = filename.trim() ? filename.trim() : 'deals';
      const extension = fileType.toLowerCase();
      const fullName = cleanFilename.endsWith(`.${extension}`) 
        ? cleanFilename 
        : `${cleanFilename}.${extension}`;

      const payload = {
        name: fullName,
        type: fileType,
        headers: selectedColumns,
        data: dataToExport,
        downloadable: true,
        skipHeader: false
      };

      // 4. Download file
      const blob = await dealsApi.downloadSpreadsheet(payload);
      
      // 5. Trigger download in browser
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fullName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast('Spreadsheet downloaded successfully', 'success');
      onClose();
    } catch (error: unknown) {
      console.error('Failed to download spreadsheet:', error);
      const message = error instanceof Error ? error.message : 'Failed to download spreadsheet';
      toast(message, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Download Deals Data">
      <form onSubmit={handleDownload} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">
              File Name
            </label>
            <input
              type="text"
              required
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm"
              placeholder="e.g. deals"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setFileType('XLSX')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  fileType === 'XLSX'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/40 hover:text-foreground/75'
                }`}
              >
                <FontAwesomeIcon icon={faFileExcel} className={fileType === 'XLSX' ? 'text-green-500' : ''} />
                XLSX
              </button>
              <button
                type="button"
                onClick={() => setFileType('CSV')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  fileType === 'CSV'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/40 hover:text-foreground/75'
                }`}
              >
                <FontAwesomeIcon icon={faFileCsv} className={fileType === 'CSV' ? 'text-blue-500' : ''} />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest ml-1">
              Select Columns ({selectedColumns.length} selected)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Select All
              </button>
              <span className="text-[10px] text-foreground/20">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-foreground/40 hover:text-foreground/60 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-border/50 rounded-2xl bg-muted/20 p-3 grid grid-cols-2 gap-2">
            {AVAILABLE_COLUMNS.map(col => {
              const isChecked = selectedColumns.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleColumn(col.key)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isChecked
                      ? 'bg-primary/5 border-primary/20 text-primary shadow-sm shadow-primary/5'
                      : 'bg-card/50 border-border/50 text-foreground/60 hover:bg-card hover:border-border'
                  }`}
                >
                  <span className="text-xs font-semibold truncate pr-1">{col.label}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-foreground/20'
                    }`}
                  >
                    {isChecked && <FontAwesomeIcon icon={faCheck} className="text-[9px] font-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDownloading}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                Downloading...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="text-sm" />
                Download
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
