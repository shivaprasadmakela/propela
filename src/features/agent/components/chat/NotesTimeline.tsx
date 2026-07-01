import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky } from '@fortawesome/free-solid-svg-icons';
import { type NoteEntity } from '@/domains/deals/api/dealsApi';

interface NotesTimelineProps {
  notes: NoteEntity[];
}

export function NotesTimeline({ notes }: NotesTimelineProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">
        No notes associated with this deal.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 mt-3">
      <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1 flex items-center gap-1.5">
        <FontAwesomeIcon icon={faNoteSticky} className="text-[11px]" />
        <span>Notes Timeline ({notes.length})</span>
      </div>
      <div className="relative pl-3 border-l-2 border-border/80 ml-2 space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="relative text-xs">
            <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-card" />
            <div className="bg-card border border-border p-2.5 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-1 text-[10px] text-foreground/40">
                <span className="font-semibold text-foreground/50 text-ellipsis overflow-hidden">
                  {note.createdBy?.name || 'User'}
                </span>
                <span>
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(note.createdAt * 1000))}
                </span>
              </div>
              <p className="text-foreground/75 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
