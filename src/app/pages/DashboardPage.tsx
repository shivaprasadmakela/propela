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
  'Total': 'bg-indigo-500',
  'Fresh': 'bg-sky-400',
  'Contactable': 'bg-amber-400',
  'Non Contactable': 'bg-orange-400',
  'Visit': 'bg-teal-400',
  'Revisit': 'bg-emerald-500',
  'Lost': 'bg-rose-400',
  'Booking': 'bg-emerald-600',
};

// Color cycling for row badges
const BADGE_COLORS = [
  'bg-rose-500 text-white',
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-cyan-500 text-white',
];

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'deal' | 'cp'>('deal');
  
  // Filter States
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [stages, setStages] = useState<StageEntity[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('Last 6 Months');
  const [timePeriod, setTimePeriod] = useState<'W' | 'M'>('W');
  
  // Custom Date States
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Data & Loading States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPeriodData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Expansion State
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({ 0: true }); // Default first expanded

  // Predefined presets
  const DATE_PRESETS = [
    'Today', 'Yesterday', 'This week', 'This month', 'Last week', 
    'Last month', 'Last 7 Days', 'Last 30 Days', 'Last 60 Days', 'Last 6 Months'
  ];

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
        const start = customStartDate ? new Date(customStartDate) : new Date();
        const end = customEndDate ? new Date(customEndDate) : new Date();
        end.setHours(23, 59, 59);
        range = {
          start: Math.floor(start.getTime() / 1000),
          end: Math.floor(end.getTime() / 1000)
        };
      } else {
        range = getDateRange(selectedDatePreset);
      }

      const payload: AnalyticsPayload = {
        includeTotal: true,
        includePercentage: true,
        includeZero: true,
        includeAll: true,
        timePeriod: timePeriod === 'W' ? 'WEEKS' : 'MONTHS',
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
    const start = new Date(zonedFirst * 1000);
    const end = new Date(zonedSecond * 1000);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Helper component to render standard progress-bar cell
  const renderValueCell = (percentage: number, count: number, id: string) => {
    const barColor = COLUMN_COLORS[id] || 'bg-primary';
    return (
      <div className="flex flex-col min-w-[100px] py-1">
        <span className="text-[10px] font-bold text-foreground/50 mb-0.5">{percentage.toFixed(2)}%</span>
        <div className="flex items-center gap-2">
          <div className="flex-grow h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-foreground/80 w-8 text-right shrink-0">{count}</span>
        </div>
      </div>
    );
  };

  // Get aggregated stats by source for the donut chart
  const getSourceStats = () => {
    const totals: Record<string, number> = {};
    let totalCount = 0;

    analyticsData.forEach(period => {
      period.statusCount.forEach(source => {
        if (source.name !== 'Total') {
          const totalVal = source.perCount.find(pc => pc.id === 'Total')?.value.count || 0;
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
        const totalDeals = period.statusCount.find(sc => sc.name === 'Total')?.perCount.find(pc => pc.id === 'Total')?.value.count || 0;
        const start = new Date(period.datePair.zonedFirst * 1000);
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
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-foreground/40 mt-1">Overview of your sales pipeline and activity</p>
      </div>

      {/* Main card panel */}
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        
        {/* Card Header with tabs */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/5">
          <div className="flex p-1 rounded-2xl bg-muted/20 border border-border/50">
            <button
              onClick={() => setActiveTab('deal')}
              className={`px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all ${
                activeTab === 'deal'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground/40 hover:text-foreground/70'
              }`}
            >
              Deal Dashboard
            </button>
            <button
              onClick={() => setActiveTab('cp')}
              className={`px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all ${
                activeTab === 'cp'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground/40 hover:text-foreground/70'
              }`}
            >
              CP Dashboard
            </button>
          </div>
        </div>

        {activeTab === 'cp' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-primary/60">
              <FontAwesomeIcon icon={faFilter} className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-foreground">CP Dashboard Coming Soon</h3>
            <p className="text-sm text-foreground/40 mt-1 max-w-sm">Channel Partner dashboard metrics and analysis will be available here.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Filter Controls Bar */}
            <div className="p-6 border-b border-border/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-card">
              
              {/* Assignee Filter */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="opacity-60" /> Assignee
                </label>
                <div className="relative group">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Assignee</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{`${u.firstName} ${u.lastName}`}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 text-xs pointer-events-none" />
                </div>
              </div>

              {/* Product Filter */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBox} className="opacity-60" /> Product
                </label>
                <div className="relative group">
                  <select
                    value={selectedProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 text-xs pointer-events-none" />
                </div>
              </div>

              {/* Date Filter & Preset */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendar} className="opacity-60" /> Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative group">
                    <select
                      value={isCustomDate ? 'custom' : selectedDatePreset}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomDate(true);
                        } else {
                          setIsCustomDate(false);
                          setSelectedDatePreset(e.target.value);
                        }
                      }}
                      className="w-full pl-3 pr-8 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-xs outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                    >
                      <option value="custom">Custom Range</option>
                      {DATE_PRESETS.map(preset => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 text-xs pointer-events-none" />
                  </div>

                  {isCustomDate ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-[48%] px-2 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-foreground text-[10px] outline-none focus:border-primary/30"
                      />
                      <span className="text-foreground/30 text-[10px]">-</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-[48%] px-2 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-foreground text-[10px] outline-none focus:border-primary/30"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-2.5 bg-muted/10 border border-border/30 rounded-2xl text-[10px] font-medium text-foreground/60 leading-none truncate">
                      {isInitialLoading ? 'Loading dates...' : (
                        (() => {
                          const range = getDateRange(selectedDatePreset);
                          return formatDateRange(range.start, range.end);
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* View Period Toggle (Weekly / Monthly) */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">
                  View Interval
                </label>
                <div className="flex p-0.5 rounded-2xl bg-muted/20 border border-border/50 w-28 h-10 self-start">
                  <button
                    onClick={() => setTimePeriod('W')}
                    className={`flex-grow rounded-xl text-xs font-bold transition-all ${
                      timePeriod === 'W'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/30 hover:text-foreground/60'
                    }`}
                  >
                    W
                  </button>
                  <button
                    onClick={() => setTimePeriod('M')}
                    className={`flex-grow rounded-xl text-xs font-bold transition-all ${
                      timePeriod === 'M'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/30 hover:text-foreground/60'
                    }`}
                  >
                    M
                  </button>
                </div>
              </div>

            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto min-h-[300px]">
              {isTableLoading && analyticsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 text-center">
                  <FontAwesomeIcon icon={faSpinner} className="text-2xl text-primary animate-spin mb-4" />
                  <p className="text-sm text-foreground/50">Fetching analytics data...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-24 text-center text-red-400">
                  <p className="text-sm font-bold mb-2">Error Loading Analytics</p>
                  <p className="text-xs max-w-sm mb-4">{error}</p>
                  <button
                    onClick={fetchAnalytics}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-all text-xs"
                  >
                    Try Again
                  </button>
                </div>
              ) : analyticsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 text-center text-foreground/40">
                  <p className="text-sm font-semibold">No data available</p>
                  <p className="text-xs mt-1">Try expanding your date range or removing filters.</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                      <th className="py-4 px-6">{timePeriod === 'W' ? 'WEEKLY' : 'MONTHLY'}</th>
                      <th className="py-4 px-4 text-center">TOTAL DEALS</th>
                      <th className="py-4 px-4">FRESH</th>
                      <th className="py-4 px-4">CONTACTABLE</th>
                      <th className="py-4 px-4">NON CONTACTABLE</th>
                      <th className="py-4 px-4">VISIT</th>
                      <th className="py-4 px-4">REVISIT</th>
                      <th className="py-4 px-4">LOST</th>
                      <th className="py-4 px-4">BOOKING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {analyticsData.map((period, periodIdx) => {
                      const totalSource = period.statusCount.find(sc => sc.name === 'Total');
                      const subSources = period.statusCount.filter(sc => sc.name !== 'Total');
                      const isExpanded = !!expandedRows[periodIdx];
                      
                      const badgeBg = BADGE_COLORS[periodIdx % BADGE_COLORS.length];
                      
                      return (
                        <React.Fragment key={periodIdx}>
                          {/* Main/Total Period Row */}
                          <tr 
                            onClick={() => toggleRow(periodIdx)}
                            className="hover:bg-muted/10 transition-colors cursor-pointer group font-medium"
                          >
                            <td className="py-5 px-6 flex items-center gap-3">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${badgeBg}`}>
                                {periodIdx + 1}
                              </span>
                              <span className="text-sm font-bold text-primary group-hover:text-primary-focus leading-none">
                                {formatDateRange(period.datePair.zonedFirst, period.datePair.zonedSecond)}
                              </span>
                              <FontAwesomeIcon 
                                icon={isExpanded ? faChevronUp : faChevronDown} 
                                className="text-foreground/20 group-hover:text-foreground/40 text-xs transition-colors shrink-0" 
                              />
                            </td>
                            {/* Total deals main row is bold and underlined */}
                            <td className="py-5 px-4 text-center text-sm font-bold text-foreground/80">
                              <span className="underline decoration-2 decoration-foreground/20 hover:decoration-primary/50 cursor-pointer">
                                {totalSource?.perCount.find(pc => pc.id === 'Total')?.value.count || 0}
                              </span>
                            </td>
                            {/* Other columns display values with progress bars */}
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Fresh')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Fresh')?.value.count || 0,
                                'Fresh'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Contactable')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Contactable')?.value.count || 0,
                                'Contactable'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Non Contactable')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Non Contactable')?.value.count || 0,
                                'Non Contactable'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Visit')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Visit')?.value.count || 0,
                                'Visit'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Revisit')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Revisit')?.value.count || 0,
                                'Revisit'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Lost')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Lost')?.value.count || 0,
                                'Lost'
                              )}
                            </td>
                            <td className="py-5 px-4">
                              {renderValueCell(
                                totalSource?.perCount.find(pc => pc.id === 'Booking')?.value.percentage || 0,
                                totalSource?.perCount.find(pc => pc.id === 'Booking')?.value.count || 0,
                                'Booking'
                              )}
                            </td>
                          </tr>

                          {/* Sub-Rows */}
                          {isExpanded && subSources.map((source, subIdx) => (
                            <tr key={subIdx} className="bg-muted/5 hover:bg-muted/10 transition-colors text-xs text-foreground/60 border-b border-border/10">
                              <td className="py-4 pl-14 pr-6 font-medium font-mono text-foreground/40 uppercase tracking-wider">
                                {source.name}
                              </td>
                              {/* Total deals in sub-rows has percentage bar as well */}
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Total')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Total')?.value.count || 0,
                                  'Total'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Fresh')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Fresh')?.value.count || 0,
                                  'Fresh'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Contactable')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Contactable')?.value.count || 0,
                                  'Contactable'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Non Contactable')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Non Contactable')?.value.count || 0,
                                  'Non Contactable'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Visit')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Visit')?.value.count || 0,
                                  'Visit'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Revisit')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Revisit')?.value.count || 0,
                                  'Revisit'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Lost')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Lost')?.value.count || 0,
                                  'Lost'
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {renderValueCell(
                                  source.perCount.find(pc => pc.id === 'Booking')?.value.percentage || 0,
                                  source.perCount.find(pc => pc.id === 'Booking')?.value.count || 0,
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

            {/* Bottom Chart Widgets Side-By-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border-t border-border/40 bg-muted/10">
              
              {/* Line Chart Widget: Deal Performance */}
              <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col shadow-sm">
                <h3 className="text-sm font-bold text-foreground">Deal Performance</h3>
                
                <div className="mt-4 flex-grow flex items-center justify-center">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[220px]">
                    {/* Grid lines */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const y = paddingTop + (i / 5) * graphHeight;
                      const val = Math.round(maxValue - (i / 5) * maxValue);
                      return (
                        <g key={i} className="opacity-40">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="var(--color-border, #e2e8f0)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingLeft - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="text-[10px] font-medium fill-foreground/40 font-sans"
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
                        className="opacity-25"
                      />
                    )}

                    {/* Curve Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
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
                          r="5.5"
                          fill="#ffffff"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />
                        {/* Hover values tooltip display inside SVG */}
                        <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
                          <rect
                            x={pt.x - 22}
                            y={pt.y - 28}
                            width="44"
                            height="18"
                            rx="4"
                            fill="#1e293b"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 16}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-white"
                          >
                            {pt.value}
                          </text>
                        </g>
                        {/* X Axis label */}
                        <text
                          x={pt.x}
                          y={chartHeight - paddingBottom + 18}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-foreground/30 font-sans"
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
              <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col shadow-sm">
                <h3 className="text-sm font-bold text-foreground">Deals by source</h3>

                <div className="mt-4 flex-grow flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Donut */}
                  <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-border, #f1f5f9)" strokeWidth="12" />
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={`${seg.strokeDash} 314.16`}
                          strokeDashoffset={-seg.offset}
                          className="transition-all duration-500"
                        />
                      ))}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest leading-none">Total</span>
                      <span className="text-xl font-black text-foreground mt-0.5 leading-none">{displayTotalCount}</span>
                    </div>
                  </div>

                  {/* Legend Grid */}
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                    {donutSegments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <FontAwesomeIcon icon={faCircle} style={{ color: seg.color }} className="text-[10px] shrink-0" />
                        <span className="font-semibold text-foreground/60 truncate max-w-[120px]">{seg.source}</span>
                        <span className="font-bold text-foreground/80 ml-auto shrink-0">({seg.count})</span>
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
