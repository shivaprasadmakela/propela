import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
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
import { DEAL_SOURCES, DEAL_SUB_SOURCES } from '../utils/dealConstants';

interface DealFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
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
  const [selectedSubSources, setSelectedSubSources] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const availableSubSources = useMemo(() => {
    if (selectedSources.length === 0) {
      return Array.from(new Set(Object.values(DEAL_SUB_SOURCES).flat()));
    }
    return Array.from(new Set(selectedSources.flatMap(s => DEAL_SUB_SOURCES[s] || [])));
  }, [selectedSources]);

  if (!isOpen) return null;

  const tabs: { label: FilterTab; icon: IconDefinition }[] = [
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
    setSelectedSubSources([]);
    setSelectedStages([]);
    setSelectedStatuses([]);
  };

  const handleApply = () => {
    onApply({
      dateRange: selectedDatePreset,
      sources: selectedSources,
      subSources: selectedSubSources,
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
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pb-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-[24px] w-full max-w-[900px] h-[600px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex min-h-0">
          {}
          <div className="w-[240px] border-r border-border overflow-y-auto p-4 bg-white/[0.02]">
            {tabs.map((tab) => (
              <div
                key={tab.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 font-medium text-sm ${
                  activeTab === tab.label 
                    ? 'bg-muted text-primary shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                <div className="w-5 flex justify-center text-base">
                  <FontAwesomeIcon icon={tab.icon} />
                </div>
                {tab.label}
              </div>
            ))}
          </div>

          {}
          <div className="flex-1 p-8 overflow-y-auto bg-card">
            {activeTab === 'Date Range' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 font-semibold text-lg mb-6">
                  <FontAwesomeIcon icon={faCircleDot} className="text-foreground" />
                  Date presets
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {DATE_PRESETS.map((preset) => (
                    <div
                      key={preset}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedDatePreset === preset ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => setSelectedDatePreset(preset)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedDatePreset === preset ? 'border-foreground' : 'border-border'
                      }`}>
                        {selectedDatePreset === preset && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
                      </div>
                      <span className="text-[0.95rem]">{preset}</span>
                    </div>
                  ))}
                </div>

                <div className="my-8 h-px bg-border" />

                <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted text-muted-foreground">
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                  <span className="text-[0.95rem]">Custom date range</span>
                </div>
              </div>
            )}

            {activeTab === 'Source' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="font-semibold text-lg mb-6">Select Sources</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {DEAL_SOURCES.map((source) => (
                    <div
                      key={source}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedSources.includes(source) ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => {
                        toggleFilter(selectedSources, setSelectedSources, source);
                      }}
                    >
                      <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all ${
                        selectedSources.includes(source) ? 'border-foreground bg-foreground' : 'border-border'
                      }`}>
                        {selectedSources.includes(source) && <div className="w-2 h-2 text-primary-foreground text-[10px]">✓</div>}
                      </div>
                      <span className="text-[0.95rem]">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Sub Source' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="font-semibold text-lg mb-6">Select Sub Sources</div>
                {availableSubSources.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {availableSubSources.map((subSource) => (
                      <div
                        key={subSource}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                          selectedSubSources.includes(subSource) ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}
                        onClick={() => toggleFilter(selectedSubSources, setSelectedSubSources, subSource)}
                      >
                        <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all ${
                          selectedSubSources.includes(subSource) ? 'border-foreground bg-foreground' : 'border-border'
                        }`}>
                          {selectedSubSources.includes(subSource) && <div className="w-2 h-2 text-primary-foreground text-[10px]">✓</div>}
                        </div>
                        <span className="text-[0.95rem]">{subSource}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faSitemap} className="text-2xl text-primary/40" />
                    </div>
                    <p className="text-muted-foreground text-sm">No sub sources available for the selected sources.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Stage' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="font-semibold text-lg mb-6">Select Stages</div>
                <div className="grid grid-cols-2 gap-5">
                  {['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedStages.includes(stage) ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => toggleFilter(selectedStages, setSelectedStages, stage)}
                    >
                      <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all ${
                        selectedStages.includes(stage) ? 'border-foreground bg-foreground' : 'border-border'
                      }`}>
                        {selectedStages.includes(stage) && <div className="w-2 h-2 text-primary-foreground text-[10px]">✓</div>}
                      </div>
                      <span className="text-[0.95rem]">{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Status' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="font-semibold text-lg mb-6">Select Statuses</div>
                <div className="grid grid-cols-2 gap-5">
                  {['Active', 'Pending', 'On Hold', 'Completed', 'Cancelled'].map((status) => (
                    <div
                      key={status}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedStatuses.includes(status) ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                    >
                      <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all ${
                        selectedStatuses.includes(status) ? 'border-foreground bg-foreground' : 'border-border'
                      }`}>
                        {selectedStatuses.includes(status) && <div className="w-2 h-2 text-primary-foreground text-[10px]">✓</div>}
                      </div>
                      <span className="text-[0.95rem]">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['Date Type', 'Product', 'Assigned User', 'Campaign', 'Tag', 'Ad'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-300">
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

        {}
        <div className="px-8 py-6 border-t border-border flex justify-between items-center bg-card">
          <button 
            className="bg-transparent border-none text-foreground font-semibold text-[0.9rem] cursor-pointer uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity" 
            onClick={handleReset}
          >
            RESET FILTER
          </button>
          <div className="flex gap-3">
            <button 
              className="px-6 py-2.5 rounded-full border border-border bg-transparent text-foreground font-semibold cursor-pointer transition-all hover:bg-muted" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-8 py-2.5 rounded-full bg-[#27272a] text-white border-none font-semibold cursor-pointer transition-all hover:bg-[#3f3f46] hover:-translate-y-0.5" 
              onClick={handleApply}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
