import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faCalendarCheck,
  faFilter,
  faSitemap,
  faLayerGroup,
  faFlag,
  faBox,
  faUser,
  faBullhorn,
  faTag,
  faImage,
  faCircleDot
} from '@fortawesome/free-solid-svg-icons';
import './DealFilterModal.css';

interface DealFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

type FilterTab = 
  | 'Date Type' 
  | 'Date Range' 
  | 'Source' 
  | 'Sub Source' 
  | 'Stage' 
  | 'Status' 
  | 'Product' 
  | 'Assigned User' 
  | 'Campaign' 
  | 'Tag' 
  | 'Ad';

const DATE_PRESETS = [
  'Today', 'Yesterday', 'This week', 'This month', 'Last week', 
  'Last month', 'Last 7 Days', 'Last 30 Days', 'Last 60 Days', 'Last 6 Months'
];

export function DealFilterModal({ isOpen, onClose, onApply }: DealFilterModalProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Date Range');
  const [selectedDatePreset, setSelectedDatePreset] = useState('Last 6 Months');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  if (!isOpen) return null;

  const tabs: { label: FilterTab; icon: any }[] = [
    { label: 'Date Type', icon: faCalendar },
    { label: 'Date Range', icon: faCalendarCheck },
    { label: 'Source', icon: faFilter },
    { label: 'Sub Source', icon: faSitemap },
    { label: 'Stage', icon: faLayerGroup },
    { label: 'Status', icon: faFlag },
    { label: 'Product', icon: faBox },
    { label: 'Assigned User', icon: faUser },
    { label: 'Campaign', icon: faBullhorn },
    { label: 'Tag', icon: faTag },
    { label: 'Ad', icon: faImage },
  ];

  const handleReset = () => {
    setSelectedDatePreset('Last 6 Months');
    setSelectedSources([]);
    setSelectedStages([]);
    setSelectedStatuses([]);
  };

  const handleApply = () => {
    onApply({
      dateRange: selectedDatePreset,
      sources: selectedSources,
      stages: selectedStages,
      statuses: selectedStatuses,
    });
    onClose();
  };

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="filter-modal-body">
          {/* Sidebar */}
          <div className="filter-modal-sidebar">
            {tabs.map((tab) => (
              <div
                key={tab.label}
                className={`filter-tab-item ${activeTab === tab.label ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.label)}
              >
                <div className="filter-tab-icon">
                  <FontAwesomeIcon icon={tab.icon} />
                </div>
                {tab.label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="filter-modal-content">
            {activeTab === 'Date Range' && (
              <div className="animate-fade-in">
                <div className="filter-section-title">
                  <FontAwesomeIcon icon={faCircleDot} className="text-foreground" />
                  Date presets
                </div>
                <div className="options-grid">
                  {DATE_PRESETS.map((preset) => (
                    <div
                      key={preset}
                      className={`radio-option ${selectedDatePreset === preset ? 'selected' : ''}`}
                      onClick={() => setSelectedDatePreset(preset)}
                    >
                      <div className="radio-circle" />
                      <span className="radio-label">{preset}</span>
                    </div>
                  ))}
                </div>

                <div className="custom-range-divider" />

                <div className="radio-option">
                  <div className="radio-circle" />
                  <span className="radio-label">Custom date range</span>
                </div>
              </div>
            )}

            {activeTab === 'Source' && (
              <div className="animate-fade-in">
                <div className="filter-section-title">Select Sources</div>
                <div className="options-grid">
                  {['Facebook', 'Google', 'LinkedIn', 'Referral', 'Website', 'Direct'].map((source) => (
                    <div
                      key={source}
                      className={`radio-option ${selectedSources.includes(source) ? 'selected' : ''}`}
                      onClick={() => toggleFilter(selectedSources, setSelectedSources, source)}
                    >
                      <div className="radio-circle" style={{ borderRadius: '4px' }} />
                      <span className="radio-label">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Stage' && (
              <div className="animate-fade-in">
                <div className="filter-section-title">Select Stages</div>
                <div className="options-grid">
                  {['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => (
                    <div
                      key={stage}
                      className={`radio-option ${selectedStages.includes(stage) ? 'selected' : ''}`}
                      onClick={() => toggleFilter(selectedStages, setSelectedStages, stage)}
                    >
                      <div className="radio-circle" style={{ borderRadius: '4px' }} />
                      <span className="radio-label">{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Status' && (
              <div className="animate-fade-in">
                <div className="filter-section-title">Select Statuses</div>
                <div className="options-grid">
                  {['Active', 'Pending', 'On Hold', 'Completed', 'Cancelled'].map((status) => (
                    <div
                      key={status}
                      className={`radio-option ${selectedStatuses.includes(status) ? 'selected' : ''}`}
                      onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                    >
                      <div className="radio-circle" style={{ borderRadius: '4px' }} />
                      <span className="radio-label">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['Date Type', 'Sub Source', 'Product', 'Assigned User', 'Campaign', 'Tag', 'Ad'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={tabs.find(t => t.label === activeTab)?.icon} className="text-2xl text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{activeTab} Filters</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Filtering options for {activeTab} will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="filter-modal-footer">
          <button className="btn-reset" onClick={handleReset}>
            RESET FILTER
          </button>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-apply" onClick={handleApply}>
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
