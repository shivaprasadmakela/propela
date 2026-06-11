import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronUp, 
  faCalendar,
  faUser,
  faBox,
  faSpinner,
  faCircle,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { productApi, type ProductEntity } from '@/domains/products/api/productApi';
import { stagesApi, type StageEntity } from '@/domains/stages/api/stagesApi';
import { dealsApi } from '@/domains/deals/api/dealsApi';
import { analyticsApi, type AnalyticsPayload, type AnalyticsPeriodData } from '@/domains/deals/api/analyticsApi';
import { getDateRange } from '@/shared/utils/dateUtils';

// Color mapping for columns
const COLUMN_COLORS: Record<string, string> = {
  'Total': 'bg-indigo-400',
  'Fresh': 'bg-sky-400',
  'Contactable': 'bg-amber-400',
  'Non Contactable': 'bg-orange-400',
  'Visit': 'bg-teal-400',
  'Revisit': 'bg-emerald-400',
  'Lost': 'bg-rose-400',
  'Booking': 'bg-emerald-500',
};

// Color cycling for row badges
const BADGE_COLORS = [
  'border-rose-300 text-rose-500 bg-rose-500/5',
  'border-blue-300 text-blue-500 bg-blue-500/5',
  'border-emerald-300 text-emerald-500 bg-emerald-500/5',
  'border-amber-300 text-amber-500 bg-amber-500/5',
  'border-purple-300 text-purple-500 bg-purple-500/5',
  'border-cyan-300 text-cyan-500 bg-cyan-500/5',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027', '2028'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'deal' | 'cp'>('deal');
  
  // Filter States
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [stages, setStages] = useState<StageEntity[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('Last 4 Weeks'); // Default to 4 Weeks
  const [timePeriod, setTimePeriod] = useState<'W' | 'M'>('W');
  
  // Popup Date Picker States
  const [showPickerPopup, setShowPickerPopup] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'preset' | 'custom'>('preset');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Dropdown Select States for custom dates (defaulting dynamic June/May values matching layout)
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 21); // 3 weeks ago
  
  const [startYear, setStartYear] = useState<string>(String(defaultStart.getFullYear()));
  const [startMonth, setStartMonth] = useState<string>(MONTHS[defaultStart.getMonth()]);
  const [startDay, setStartDay] = useState<string>(String(defaultStart.getDate()));
  
  const [endYear, setEndYear] = useState<string>(String(now.getFullYear()));
  const [endMonth, setEndMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [endDay, setEndDay] = useState<string>(String(now.getDate()));

  // Data & Loading States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPeriodData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Expansion State (initially all closed)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Predefined presets
  const DATE_PRESETS = [
    'Today', 'Yesterday', 'This week', 'This month', 'Last week', 
    'Last month', 'Last 7 Days', 'Last 30 Days', 'Last 4 Weeks', 'Last 60 Days', 'Last 6 Months'
  ];

  // Collapse rows whenever filters change
  useEffect(() => {
    setExpandedRows({});
  }, [selectedUser, selectedProduct, selectedDatePreset, timePeriod, isCustomDate]);

  // Load static filters
  useEffect(() => {
    const initData = async () => {
      setIsInitialLoading(true);
      try {
        const [fetchedUsers, fetchedProducts, fetchedStages] = await Promise.all([
          loadUsers(),
          loadProducts(),
          loadDefaultStages()
        ]);
        setUsers(fetchedUsers);
        setProducts(fetchedProducts);
        setStages(fetchedStages);
      } catch (err) {
        console.error('Failed to initialize dashboard resources:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initData();
  }, []);

  // Run analytics fetch when components change
  useEffect(() => {
    if (!isInitialLoading) {
      fetchAnalytics();
    }
  }, [stages, selectedDatePreset, selectedUser, selectedProduct, timePeriod, isCustomDate, customStartDate, customEndDate, isInitialLoading]);

  const loadUsers = async () => {
    try {
      const response = await dealsApi.fetchUsers({
        condition: {
          conditions: [{ conditions: [], operator: 'OR' }],
          operator: 'AND'
        },
        eager: true,
        size: 100,
        page: 0,
        sort: [{ property: 'createdAt', direction: 'DESC' }],
        eagerFields: ['firstName', 'lastName', 'id']
      });
      return Array.isArray(response) ? response : (response.content || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productApi.fetchProducts({
        condition: { conditions: [], operator: 'AND' },
        eager: false,
        size: 100,
        page: 0,
        sort: [{ property: 'name', direction: 'ASC' }],
        eagerFields: []
      });
      return response.content || [];
    } catch (err) {
      console.error('Error fetching products:', err);
      return [];
    }
  };

  const loadDefaultStages = async () => {
    try {
      const templatesRes = await productApi.fetchProductTemplates({ size: 5, page: 0 });
      const templates = templatesRes.content || [];
      if (templates.length > 0) {
        const stagesRes = await stagesApi.fetchList({
          productTemplateId: templates[0].id,
          isParent: true,
          size: 100,
          sort: 'order,ASC'
        });
        return stagesRes.content || [];
      }
    } catch (err) {
      console.error('Error loading default stages:', err);
    }
    return [];
  };

  const loadStagesForProduct = async (productId: number) => {
    try {
      const product = products.find(p => p.id === productId);
      const templateId = product?.productTemplateId && typeof product.productTemplateId === 'object'
        ? product.productTemplateId.id
        : product?.productTemplateId;
      if (templateId) {
        const stagesRes = await stagesApi.fetchList({
          productTemplateId: templateId as number,
          isParent: true,
          size: 100,
          sort: 'order,ASC'
        });
        return stagesRes.content || [];
      }
    } catch (err) {
      console.error('Error loading stages for product:', err);
    }
    return [];
  };

  const handleProductChange = async (productIdStr: string) => {
    setSelectedProduct(productIdStr);
    setIsTableLoading(true);
    if (productIdStr === 'all') {
      const defaultStages = await loadDefaultStages();
      setStages(defaultStages);
    } else {
      const productStages = await loadStagesForProduct(Number(productIdStr));
      setStages(productStages);
    }
  };

  const fetchAnalytics = async () => {
    if (stages.length === 0) return;
    setIsTableLoading(true);
    setError(null);
    try {
      let range: { start: number; end: number };
      if (isCustomDate) {
        const startMonthIndex = MONTHS.indexOf(startMonth);
        const endMonthIndex = MONTHS.indexOf(endMonth);
        const start = new Date(Number(startYear), startMonthIndex, Number(startDay));
        const end = new Date(Number(endYear), endMonthIndex, Number(endDay));
        end.setHours(23, 59, 59);
        range = {
          start: Math.floor(start.getTime() / 1000),
          end: Math.floor(end.getTime() / 1000)
        };
      } else {
        range = getDateRange(selectedDatePreset);
      }

      // Group by DAYS if range spans less than a week to prevent server division error on WEEKS grouping
      const durationDays = (range.end - range.start) / (24 * 3600);
      const computedPeriod = durationDays < 7 
        ? 'DAYS' 
        : (timePeriod === 'W' ? 'WEEKS' : 'MONTHS');

      const payload: AnalyticsPayload = {
        includeTotal: true,
        includePercentage: true,
        includeZero: true,
        includeAll: true,
        timePeriod: computedPeriod,
        startDate: range.start,
        endDate: range.end,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        stageIds: stages.map(s => s.id),
        userIds: selectedUser !== 'all' ? [Number(selectedUser)] : undefined,
        productIds: selectedProduct !== 'all' ? [Number(selectedProduct)] : undefined,
      };

      const response = await analyticsApi.fetchStageCounts(payload);
      setAnalyticsData(response.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data.');
    } finally {
      setIsTableLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatDateRange = (zonedFirst: number, zonedSecond: number) => {
    if (!zonedFirst || !zonedSecond) return 'Unknown Range';
    const start = new Date(zonedFirst * 1000);
    const end = new Date(zonedSecond * 1000);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Unknown Range';
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const formatDatePickerLabel = () => {
    if (isCustomDate) {
      const startMonthIndex = MONTHS.indexOf(startMonth);
      const endMonthIndex = MONTHS.indexOf(endMonth);
      const start = new Date(Number(startYear), startMonthIndex, Number(startDay));
      const end = new Date(Number(endYear), endMonthIndex, Number(endDay));
      return formatDateRange(Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000));
    }
    const range = getDateRange(selectedDatePreset);
    return formatDateRange(range.start, range.end);
  };

  const handleSubmitCustomRange = () => {
    const startMonthIndex = MONTHS.indexOf(startMonth);
    const endMonthIndex = MONTHS.indexOf(endMonth);
    const start = new Date(Number(startYear), startMonthIndex, Number(startDay));
    const end = new Date(Number(endYear), endMonthIndex, Number(endDay));
    end.setHours(23, 59, 59);

    setCustomStartDate(start.toISOString().split('T')[0]);
    setCustomEndDate(end.toISOString().split('T')[0]);
    setIsCustomDate(true);
    setShowPickerPopup(false);
  };

  // Modern clean cell layout: side-by-side count & percentage, thin line underneath
  const renderValueCell = (percentage: number, count: number, id: string) => {
    const barColor = COLUMN_COLORS[id] || 'bg-primary';
    return (
      <div className="flex flex-col gap-0.5 min-w-[90px] py-1">
        <div className="flex items-baseline justify-between text-[10px]">
          <span className="font-medium text-foreground/80">{count}</span>
          <span className="text-[9px] text-foreground/40 font-normal">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-[3px] rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>
    );
  };

  // Get aggregated stats by source for the donut chart
  const getSourceStats = () => {
    const totals: Record<string, number> = {};
    let totalCount = 0;

    analyticsData.forEach(period => {
      period.statusCount?.forEach(source => {
        if (source.name !== 'Total') {
          const totalVal = source.perCount?.find(pc => pc.id === 'Total')?.value.count || 0;
          if (totalVal > 0) {
            totals[source.name] = (totals[source.name] || 0) + totalVal;
            totalCount += totalVal;
          }
        }
      });
    });

    return { totals, totalCount };
  };

  // SVG Chart Computations
  const { totals, totalCount } = getSourceStats();
  const hasChartData = totalCount > 0;

  const sourceColors: Record<string, string> = {
    'Below the Line': '#f87171',    // red-400
    'Builder Leads': '#60a5fa',     // blue-400
    'Channel Partner': '#34d399',   // emerald-400
    'Property Expo': '#c084fc',     // purple-400
    'Social Media': '#fb923c',      // orange-400
    'Walk-in': '#facc15',           // yellow-400
  };

  const displayTotals = hasChartData ? totals : {
    'Below the Line': 1,
    'Builder Leads': 3,
    'Channel Partner': 18,
    'Property Expo': 2,
    'Social Media': 862,
    'Walk-in': 2,
  };
  const displayTotalCount = hasChartData ? totalCount : 888;

  // Donut chart stroke segments
  let currentOffset = 0;
  const donutSegments = Object.entries(displayTotals).map(([source, count]) => {
    const percentage = (count / displayTotalCount) * 100;
    const strokeDash = (percentage / 100) * 314.16;
    const offset = currentOffset;
    currentOffset += strokeDash;
    return {
      source,
      count,
      percentage,
      strokeDash,
      offset,
      color: sourceColors[source] || '#94a3b8',
    };
  });

  // Line Chart Performance Points
  const getPerformancePoints = () => {
    const points: Array<{ label: string; value: number }> = [];
    if (analyticsData.length > 0) {
      // Sort oldest to newest
      const sortedData = [...analyticsData].reverse();
      sortedData.forEach((period) => {
        const totalSource = period.statusCount?.find(sc => sc.name === 'Total');
        const totalDeals = totalSource?.perCount?.find(pc => pc.id === 'Total')?.value.count || 0;
        const zonedFirst = period.datePair?.zonedFirst || period.datePair?.first || 0;
        const start = new Date(zonedFirst * 1000);
        const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        points.push({ label, value: totalDeals });
      });
    } else {
      points.push({ label: 'May 21', value: 1 });
      points.push({ label: 'May 25', value: 16 });
      points.push({ label: 'June 1', value: 663 });
      points.push({ label: 'June 8', value: 6 });
    }
    return points;
  };

  const points = getPerformancePoints();
  const N = points.length;
  const maxValue = Math.max(...points.map(p => p.value), 10);
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const svgPoints = points.map((p, idx) => {
    const x = paddingLeft + (N > 1 ? (idx / (N - 1)) * graphWidth : 0);
    const y = chartHeight - paddingBottom - (p.value / maxValue) * graphHeight;
    return { x, y, label: p.label, value: p.value };
  });

  let pathD = '';
  let areaD = '';
  if (svgPoints.length > 0) {
    pathD = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 1; i < svgPoints.length; i++) {
      pathD += ` L ${svgPoints[i].x} ${svgPoints[i].y}`;
    }
    areaD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingBottom} L ${svgPoints[0].x} ${chartHeight - paddingBottom} Z`;
  }

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-foreground/45 mt-0.5">Overview of your sales pipeline and activity</p>
      </div>

      {/* Main card panel */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        
        {/* Underline Tab Layout */}
        <div className="flex items-center gap-6 border-b border-border/40 px-6 bg-card shrink-0">
          <button
            onClick={() => setActiveTab('deal')}
            className={`py-3 text-[11px] font-semibold tracking-wider uppercase border-b-2 transition-all relative -mb-[1.5px] ${
              activeTab === 'deal'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-foreground/45 hover:text-foreground/75'
            }`}
          >
            Deal Dashboard
          </button>
          <button
            onClick={() => setActiveTab('cp')}
            className={`py-3 text-[11px] font-semibold tracking-wider uppercase border-b-2 transition-all relative -mb-[1.5px] ${
              activeTab === 'cp'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-foreground/45 hover:text-foreground/75'
            }`}
          >
            CP Dashboard
          </button>
        </div>

        {activeTab === 'cp' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 text-primary/50">
              <FontAwesomeIcon icon={faFilter} className="text-lg" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">CP Dashboard Coming Soon</h3>
            <p className="text-xs text-foreground/40 mt-1 max-w-xs">Channel Partner dashboard metrics and analysis will be available here.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Minimal Compact Filters Bar */}
            <div className="px-6 py-4 border-b border-border/30 bg-muted/5 flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-6">
                {/* Assignee Filter */}
                <div className="flex flex-col">
                  <label className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FontAwesomeIcon icon={faUser} className="opacity-50" /> Assignee
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="pl-3 pr-8 py-1.5 rounded-xl bg-card border border-border/40 text-xs text-foreground/70 outline-none focus:border-primary/25 transition-all focus:ring-1 focus:ring-primary/5 cursor-pointer appearance-none min-w-[140px]"
                    >
                      <option value="all">All Assignee</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{`${u.firstName} ${u.lastName}`}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Product Filter */}
                <div className="flex flex-col">
                  <label className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FontAwesomeIcon icon={faBox} className="opacity-50" /> Product
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="pl-3 pr-8 py-1.5 rounded-xl bg-card border border-border/40 text-xs text-foreground/70 outline-none focus:border-primary/25 transition-all focus:ring-1 focus:ring-primary/5 cursor-pointer appearance-none min-w-[140px]"
                    >
                      <option value="all">All Products</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Custom Single Date Picker Dropdown */}
                <div className="flex flex-col relative">
                  <label className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCalendar} className="opacity-50" /> Date Range
                  </label>
                  
                  <button
                    onClick={() => setShowPickerPopup(!showPickerPopup)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/40 rounded-xl text-xs text-foreground/70 outline-none hover:bg-muted/10 transition-all select-none"
                  >
                    <FontAwesomeIcon icon={faCalendar} className="opacity-50 text-[10px]" />
                    <span>{formatDatePickerLabel()}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="opacity-30 text-[9px] ml-1" />
                  </button>

                  {showPickerPopup && (
                    <>
                      {/* Overlay background click listener to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowPickerPopup(false)} />
                      
                      {/* Popup container panel matching screenshot */}
                      <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border/60 rounded-2xl p-6 shadow-xl w-[350px] animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Option 1: Date presets */}
                        <div className="mb-4">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-foreground/85 mb-3">
                            <input
                              type="radio"
                              name="date_picker_mode"
                              checked={pickerMode === 'preset'}
                              onChange={() => setPickerMode('preset')}
                              className="accent-primary w-3.5 h-3.5"
                            />
                            <span>Date presets</span>
                          </label>
                          
                          {pickerMode === 'preset' && (
                            <div className="pl-6.5">
                              <select
                                value={selectedDatePreset}
                                onChange={(e) => {
                                  setSelectedDatePreset(e.target.value);
                                  setIsCustomDate(false);
                                  setShowPickerPopup(false);
                                }}
                                className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-muted/20 border border-border/40 text-xs text-foreground/75 outline-none cursor-pointer"
                              >
                                {DATE_PRESETS.map(preset => (
                                  <option key={preset} value={preset}>{preset}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Line Divider */}
                        <div className="my-4 border-t border-border/40" />

                        {/* Option 2: Custom date range */}
                        <div className="mb-1">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-foreground/85 mb-3">
                            <input
                              type="radio"
                              name="date_picker_mode"
                              checked={pickerMode === 'custom'}
                              onChange={() => setPickerMode('custom')}
                              className="accent-primary w-3.5 h-3.5"
                            />
                            <span>Custom date range</span>
                          </label>

                          {pickerMode === 'custom' && (
                            <div className="pl-6.5 space-y-3">
                              {/* Start Date elements row */}
                              <div>
                                <span className="text-[10px] font-semibold text-foreground/45 block mb-1">Start date</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <select
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                  <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select
                                    value={startDay}
                                    onChange={(e) => setStartDay(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* End Date elements row */}
                              <div>
                                <span className="text-[10px] font-semibold text-foreground/45 block mb-1">End date</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <select
                                    value={endYear}
                                    onChange={(e) => setEndYear(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                  <select
                                    value={endMonth}
                                    onChange={(e) => setEndMonth(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select
                                    value={endDay}
                                    onChange={(e) => setEndDay(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-foreground/75 outline-none cursor-pointer"
                                  >
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Big Submit Button */}
                              <button
                                onClick={handleSubmitCustomRange}
                                className="w-full mt-3 bg-black hover:bg-black/90 text-white text-xs font-bold py-2 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-md active:scale-98 border-none"
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* View Period Toggle (Weekly / Monthly) */}
              <div className="flex flex-col shrink-0">
                <label className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">
                  View Interval
                </label>
                <div className="flex rounded-lg bg-muted/20 border border-border/50 p-0.5 h-7">
                  <button
                    onClick={() => setTimePeriod('W')}
                    className={`px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all ${
                      timePeriod === 'W'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/45 hover:text-foreground/75'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimePeriod('M')}
                    className={`px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all ${
                      timePeriod === 'M'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/45 hover:text-foreground/75'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

            </div>

            {/* Clean Table Area */}
            <div className="flex-1 overflow-x-auto min-h-[300px]">
              {isTableLoading && analyticsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <FontAwesomeIcon icon={faSpinner} className="text-lg text-primary animate-spin mb-3" />
                  <p className="text-xs text-foreground/40">Fetching analytics data...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-20 text-center text-red-400">
                  <p className="text-xs font-semibold mb-1">Error Loading Analytics</p>
                  <p className="text-[10px] max-w-sm mb-3 opacity-80">{error}</p>
                  <button
                    onClick={fetchAnalytics}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all text-xs"
                  >
                    Try Again
                  </button>
                </div>
              ) : analyticsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center text-foreground/30">
                  <p className="text-xs font-semibold">No data available</p>
                  <p className="text-[10px] mt-0.5">Try expanding your date range or removing filters.</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/5 text-[9px] font-semibold text-foreground/45 uppercase tracking-wider">
                      <th className="py-3 px-6">{timePeriod === 'W' ? 'WEEKLY' : 'MONTHLY'}</th>
                      <th className="py-3 px-4 text-center">TOTAL DEALS</th>
                      <th className="py-3 px-4">FRESH</th>
                      <th className="py-3 px-4">CONTACTABLE</th>
                      <th className="py-3 px-4">NON CONTACTABLE</th>
                      <th className="py-3 px-4">VISIT</th>
                      <th className="py-3 px-4">REVISIT</th>
                      <th className="py-3 px-4">LOST</th>
                      <th className="py-3 px-4">BOOKING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {analyticsData.map((period, periodIdx) => {
                      const totalSource = period.statusCount?.find(sc => sc.name === 'Total');
                      const subSources = period.statusCount?.filter(sc => sc.name !== 'Total') || [];
                      const isExpanded = !!expandedRows[periodIdx];
                      
                      const badgeBg = BADGE_COLORS[periodIdx % BADGE_COLORS.length];
                      
                      return (
                        <React.Fragment key={periodIdx}>
                          {/* Main/Total Period Row */}
                          <tr 
                            onClick={() => toggleRow(periodIdx)}
                            className="hover:bg-muted/5 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-6 flex items-center gap-3">
                              {/* Tiny elegant outline border dot */}
                              <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center text-[8px] font-mono shrink-0 ${badgeBg}`}>
                                {periodIdx + 1}
                              </span>
                              <span className="text-xs font-semibold text-primary/90 leading-none">
                                {formatDateRange(period.datePair.zonedFirst, period.datePair.zonedSecond)}
                              </span>
                              <FontAwesomeIcon 
                                icon={isExpanded ? faChevronUp : faChevronDown} 
                                className="text-foreground/20 group-hover:text-foreground/40 text-[10px] transition-colors shrink-0 ml-1" 
                              />
                            </td>
                            {/* Total deals main row is bold and underlined */}
                            <td className="py-3.5 px-4 text-center text-xs font-medium text-foreground/70">
                              <span className="underline decoration-1 decoration-foreground/20 hover:decoration-primary/40 cursor-pointer">
                                {totalSource?.perCount?.find(pc => pc.id === 'Total')?.value.count || 0}
                              </span>
                            </td>
                            {/* Other columns display values with progress bars */}
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Fresh')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Fresh')?.value.count || 0,
                                'Fresh'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Contactable')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Contactable')?.value.count || 0,
                                'Contactable'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Non Contactable')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Non Contactable')?.value.count || 0,
                                'Non Contactable'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Visit')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Visit')?.value.count || 0,
                                'Visit'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Revisit')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Revisit')?.value.count || 0,
                                'Revisit'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Lost')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Lost')?.value.count || 0,
                                'Lost'
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {renderValueCell(
                                totalSource?.perCount?.find(pc => pc.id === 'Booking')?.value.percentage || 0,
                                totalSource?.perCount?.find(pc => pc.id === 'Booking')?.value.count || 0,
                                'Booking'
                              )}
                            </td>
                          </tr>

                          {/* Sub-Rows */}
                          {isExpanded && subSources.map((source, subIdx) => (
                            <tr key={subIdx} className="bg-muted/5 hover:bg-muted/10 transition-colors text-[10px] text-foreground/50 border-b border-border/10">
                              <td className="py-2.5 pl-12 pr-6 font-medium font-mono text-foreground/40 uppercase tracking-wider">
                                {source.name}
                              </td>
                              {/* Total deals in sub-rows has percentage bar as well */}
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Total')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Total')?.value.count || 0,
                                  'Total'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Fresh')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Fresh')?.value.count || 0,
                                  'Fresh'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Contactable')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Contactable')?.value.count || 0,
                                  'Contactable'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Non Contactable')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Non Contactable')?.value.count || 0,
                                  'Non Contactable'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Visit')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Visit')?.value.count || 0,
                                  'Visit'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Revisit')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Revisit')?.value.count || 0,
                                  'Revisit'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Lost')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Lost')?.value.count || 0,
                                  'Lost'
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {renderValueCell(
                                  source.perCount?.find(pc => pc.id === 'Booking')?.value.percentage || 0,
                                  source.perCount?.find(pc => pc.id === 'Booking')?.value.count || 0,
                                  'Booking'
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Clean Chart Widgets Side-By-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border-t border-border/30 bg-muted/5">
              
              {/* Line Chart Widget: Deal Performance */}
              <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col shadow-sm">
                <h3 className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider mb-2">Deal Performance</h3>
                
                <div className="mt-4 flex-grow flex items-center justify-center">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[220px]">
                    {/* Grid lines */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const y = paddingTop + (i / 5) * graphHeight;
                      const val = Math.round(maxValue - (i / 5) * maxValue);
                      return (
                        <g key={i} className="opacity-20">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="var(--color-border, #e2e8f0)"
                            strokeWidth="0.5"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={paddingLeft - 8}
                            y={y + 3}
                            textAnchor="end"
                            className="text-[9px] font-normal fill-foreground/40 font-sans"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Area Fill under Curve */}
                    {areaD && (
                      <path
                        d={areaD}
                        fill="url(#chartGradient)"
                        className="opacity-[0.08]"
                      />
                    )}

                    {/* Curve Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Coordinates Dots & Labels */}
                    {svgPoints.map((pt, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3"
                          fill="#ffffff"
                          stroke="#6366f1"
                          strokeWidth="1.5"
                        />
                        {/* Hover values tooltip display inside SVG */}
                        <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
                          <rect
                            x={pt.x - 16}
                            y={pt.y - 22}
                            width="32"
                            height="14"
                            rx="3"
                            fill="#1e293b"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            className="text-[8px] font-bold fill-white"
                          >
                            {pt.value}
                          </text>
                        </g>
                        {/* X Axis label */}
                        <text
                          x={pt.x}
                          y={chartHeight - paddingBottom + 16}
                          textAnchor="middle"
                          className="text-[9px] font-semibold fill-foreground/30 font-sans"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}

                    {/* Definitions for gradient fills */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Donut Chart Widget: Deals by source */}
              <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col shadow-sm">
                <h3 className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider mb-2">Deals by source</h3>

                <div className="mt-4 flex-grow flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Donut with clean thin ring */}
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-border, #f1f5f9)" strokeWidth="8" />
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="8"
                          strokeDasharray={`${seg.strokeDash} 314.16`}
                          strokeDashoffset={-seg.offset}
                          className="transition-all duration-500"
                        />
                      ))}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[8px] font-semibold text-foreground/30 uppercase tracking-widest leading-none">Total</span>
                      <span className="text-base font-bold text-foreground mt-0.5 leading-none">{displayTotalCount}</span>
                    </div>
                  </div>

                  {/* Clean Legend List */}
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {donutSegments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <FontAwesomeIcon icon={faCircle} style={{ color: seg.color }} className="text-[6px] shrink-0" />
                        <span className="font-medium text-foreground/50 truncate max-w-[110px]">{seg.source}</span>
                        <span className="font-semibold text-foreground/75 ml-auto shrink-0">({seg.count})</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
