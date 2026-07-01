import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory,
  faCommentDots,
  faFlag,
  faCheckCircle,
  faCircle,
  faTag,
  faArrowRightArrowLeft,
  faPersonWalking,
} from '@fortawesome/free-solid-svg-icons';
import { type DealActivity } from '@/domains/deals/api/dealsApi';

interface ActivitiesTimelineProps {
  activities: DealActivity[];
}

export function ActivitiesTimeline({ activities }: ActivitiesTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">
        No activity logs found for this deal.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1 flex items-center gap-1.5">
        <FontAwesomeIcon icon={faHistory} className="text-[11px]" />
        <span>Activity Timeline ({activities.length})</span>
      </div>
      <div className="relative pl-3 border-l-2 border-border/80 ml-2 space-y-3">
        {activities.map((activity) => {
          const actorName = getActivityActorName(activity);
          const action = activity.activityAction || '';
          const noteContent =
            activity.noteId?.content || activity.objectData?.Note?.content;
          const stageName = activity.objectData?.stage?.value;
          const previousStageName = activity.objectData?._stage?.value;
          const statusName = activity.objectData?.status?.value;
          const currentTag = activity.objectData?.tag;
          const previousTag = activity.objectData?._tag;
          const currentAssignee = activity.objectData?.assignedUserId?.value;
          const previousAssignee = activity.objectData?._assignedUserId?.value;
          const markdownDescription = activity.description?.trim();

          let icon = faCircle;
          let content: React.ReactNode = '';
          let comment = activity.comment;

          if (markdownDescription) {
            icon =
              action === 'NOTE_ADD'
                ? faCommentDots
                : action === 'STAGE_UPDATE'
                  ? faFlag
                  : action === 'STATUS_CREATE'
                    ? faCheckCircle
                    : action === 'TAG_CREATE' || action === 'TAG_UPDATE'
                      ? faTag
                      : action === 'REASSIGN'
                        ? faArrowRightArrowLeft
                        : action === 'WALK_IN'
                          ? faPersonWalking
                          : faCircle;
            content = renderInlineMarkdown(markdownDescription);
            if (action === 'NOTE_ADD') {
              comment = noteContent || comment;
            }
          } else {
            switch (action) {
              case 'NOTE_ADD':
                icon = faCommentDots;
                content = (
                  <>
                    <strong>{actorName}</strong> added a note.
                  </>
                );
                comment = noteContent || comment;
                break;
              case 'STAGE_UPDATE':
                icon = faFlag;
                content = (
                  <>
                    <strong>{actorName}</strong> moved the stage from{' '}
                    <strong>{previousStageName || 'Unknown'}</strong> to{' '}
                    <strong>{stageName || 'Unknown'}</strong>.
                  </>
                );
                break;
              case 'STATUS_CREATE':
                icon = faCheckCircle;
                content = (
                  <>
                    <strong>{actorName}</strong> created status{' '}
                    <strong>{statusName || 'Unknown'}</strong>.
                  </>
                );
                break;
              case 'TAG_CREATE':
              case 'TAG_UPDATE':
                icon = faTag;
                content = (
                  <>
                    <strong>{actorName}</strong>{' '}
                    {previousTag ? (
                      <>
                        updated the tag from <strong>{previousTag}</strong> to{' '}
                        <strong>{currentTag || 'Unknown'}</strong>.
                      </>
                    ) : (
                      <>
                        tagged the deal as <strong>{currentTag || 'Unknown'}</strong>.
                      </>
                    )}
                  </>
                );
                break;
              case 'REASSIGN':
                icon = faArrowRightArrowLeft;
                content = (
                  <>
                    <strong>{actorName}</strong> reassigned the deal from{' '}
                    <strong>{previousAssignee || 'Unassigned'}</strong> to{' '}
                    <strong>{currentAssignee || 'Unassigned'}</strong>.
                  </>
                );
                break;
              case 'WALK_IN':
                icon = faPersonWalking;
                content = (
                  <>
                    Deal was created as a <strong>walk-in</strong> by{' '}
                    <strong>{actorName}</strong>.
                  </>
                );
                break;
              default:
                icon = faCircle;
                content = (
                  <>
                    <strong>{actorName}</strong> performed{' '}
                    <strong>{action || 'an activity'}</strong>.
                  </>
                );
                comment = comment || activity.description;
                break;
            }
          }

          const time = formatActivityTime(
            activity.activityDate || activity.createdAt
          );

          return (
            <div key={activity.id} className="relative text-xs">
              <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-card border border-border flex items-center justify-center text-[7px] text-foreground/40 font-bold ring-4 ring-card">
                <FontAwesomeIcon icon={icon} />
              </span>
              <div className="bg-card border border-border p-2.5 rounded-xl shadow-sm space-y-1">
                <div className="flex justify-between items-center text-[10px] text-foreground/40 mb-1">
                  <span className="font-semibold text-foreground/50">{actorName}</span>
                  <span>{time}</span>
                </div>
                <p className="text-foreground/75 leading-relaxed">{content}</p>
                {comment && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5 mt-1">
                    <p className="text-[11px] text-foreground/55 leading-relaxed whitespace-pre-wrap">
                      {comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActivityActorName(activity: DealActivity) {
  if (activity.actorId && typeof activity.actorId === 'object') {
    return `${activity.actorId.firstName || ''} ${
      activity.actorId.lastName || ''
    }`.trim();
  }
  return activity.objectData?.user?.value || 'Anonymous';
}

function formatActivityTime(timestamp?: number) {
  if (!timestamp) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith('***') && token.endsWith('***')) {
      const value = token.slice(3, -3);
      return (
        <strong key={index}>
          <em>{value}</em>
        </strong>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      const value = token.slice(2, -2);
      return <strong key={index}>{value}</strong>;
    }
    return <span key={index}>{token}</span>;
  });
}
