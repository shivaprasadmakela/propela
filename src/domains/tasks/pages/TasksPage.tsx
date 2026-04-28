import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi, type TaskEntity } from '../api/tasksApi';
import { DataTable, type ColumnDef, type SortState } from '@/shared/ui/table/DataTable';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFilter,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortState, setSortState] = useState<SortState[]>([{ property: 'isCompleted', direction: 'ASC' }, { property: 'dueDate', direction: 'ASC' }]);
  const [activeFilters] = useState<any>({});

  const toast = useToast();

  const fetchLiveTasks = async () => {
    setIsLoading(true);
    try {
      const response = await tasksApi.fetchTasks({
        condition: {
          conditions: [
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' },
            {
              conditions: [{ field: 'contentEntitySeries', value: 'TICKET', operator: 'EQUALS' }],
              operator: 'OR'
            },
            { conditions: [], operator: 'OR' }
          ],
          operator: 'AND',
        },
        eager: true,
        size: pageSize,
        page: page,
        sort: sortState,
        eagerFields: ['name', 'code', 'userId', 'id', 'firstName', 'lastName'],
      });
      setTasks(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast('Failed to load tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTasks();
  }, [page, sortState, activeFilters]);

  const handleSortChange = (property: string) => {
    setSortState((prev) => {
      const existing = prev.find((s) => s.property === property);
      if (existing) {
        if (existing.direction === 'ASC') return [{ property, direction: 'DESC' }];
        return []; 
      }
      return [{ property, direction: 'ASC' }];
    });
    setPage(0); 
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.code?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (task: TaskEntity) => {
    if (task.isCompleted) return 'Completed';
    if (task.isCancelled) return 'Cancelled';
    const now = Date.now() / 1000; // API dueDate is likely in seconds
    if (task.dueDate && task.dueDate < now) return 'Overdue';
    return 'Pending';
  };

  const columns: ColumnDef<TaskEntity>[] = [
    {
      key: 'name',
      header: 'TASK NAME',
      sortable: true,
      render: (task) => (
        <span className="text-sm font-medium text-foreground/80">
          {task.name}
        </span>
      ),
    },
    {
      key: 'taskTypeId',
      header: 'TYPE',
      render: (task) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-600`}>
          {task.taskTypeId?.name || 'Task'}
        </span>
      ),
    },
    {
      key: 'ticketId',
      header: 'DEAL NAME',
      render: (task) => (
        <span className="text-sm text-foreground/70">
          {task.ticketId?.name || '-'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'DUE DATE AND TIME',
      sortable: true,
      render: (task) => (
        <span className="text-sm text-foreground/60">
          {task.dueDate
            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(task.dueDate * 1000))
            : '-'}
        </span>
      ),
    },
    {
      key: 'taskPriority',
      header: 'PRIORITY',
      render: (task) => (
        <span className="text-sm text-blue-500 lowercase flex items-center gap-1">
          <span className="text-xs">^</span> {task.taskPriority || 'Medium'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (task) => {
        const status = getStatus(task);
        let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
        if (status === 'Overdue') colorClass = 'bg-red-50 text-red-600 border-red-200';
        if (status === 'Completed') colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
        if (status === 'Pending') colorClass = 'bg-yellow-50 text-yellow-600 border-yellow-200';
        
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      key: 'createdBy',
      header: 'CREATED BY',
      render: (task) => (
        <span className="text-sm text-foreground/60">
          {task.createdBy?.firstName ? `${task.createdBy.firstName} ${task.createdBy.lastName || ''}` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      render: () => (
        <button className="text-sm text-primary hover:underline">
          Go to
        </button>
      ),
    }
  ];

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">List of tasks</h1>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
              <input
                type="text"
                placeholder="Search for task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className={`px-4 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                hasActiveFilters 
                  ? 'bg-primary/10 border-primary/50 text-primary hover:bg-primary/20' 
                  : 'bg-muted/50 border-border text-foreground/50 hover:bg-muted hover:text-foreground/70'
              }`}
            >
              <div className="relative">
                <FontAwesomeIcon icon={faFilter} />
                {hasActiveFilters && (
                  <FontAwesomeIcon icon={faCircle} className="absolute -top-1 -right-1 text-[6px] text-primary" />
                )}
              </div>
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {Object.keys(activeFilters).length}
                </span>
              )}
            </button>
          </div>
        </div>

        <DataTable
          data={filteredTasks}
          columns={columns}
          isLoading={isLoading}
          showSerialNumber
          startIndex={page * pageSize}
          sortState={sortState}
          onSortChange={handleSortChange}
          page={page}
          size={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
