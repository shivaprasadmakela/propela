import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import { type TaskEntity } from '@/domains/deals/api/dealsApi';

interface TasksListProps {
  tasks: TaskEntity[];
}

export function TasksList({ tasks }: TasksListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">
        No tasks associated with this deal.
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3 bg-card border border-border p-3 rounded-xl shadow-sm">
      <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FontAwesomeIcon icon={faTasks} className="text-[11px]" />
        <span>Tasks ({tasks.length})</span>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start justify-between gap-2 p-2 hover:bg-muted/40 rounded-lg transition-colors text-xs border border-border/40"
          >
            <div className="flex gap-2">
              <input
                type="checkbox"
                checked={task.isCompleted}
                readOnly
                className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <div>
                <p
                  className={`font-medium ${
                    task.isCompleted ? 'line-through text-foreground/40' : 'text-foreground/80'
                  }`}
                >
                  {task.name}
                </p>
                <p className="text-[10px] text-foreground/40">
                  Priority: {task.taskPriority || 'Medium'}
                </p>
              </div>
            </div>
            {task.dueDate && (
              <span className="text-[10px] text-foreground/45 bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(task.dueDate * 1000))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
