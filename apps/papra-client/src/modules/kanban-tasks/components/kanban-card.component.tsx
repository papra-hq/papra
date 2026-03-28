import type { Component } from 'solid-js';
import type { KanbanTask } from '../kanban-tasks.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';

export const KanbanCard: Component<{
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
  onDragStart: (e: DragEvent, task: KanbanTask) => void;
}> = (props) => {
  const { t } = useI18n();

  return (
    <div
      class="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow group"
      draggable={true}
      onDragStart={(e) => props.onDragStart(e, props.task)}
    >
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-sm font-medium leading-snug break-words min-w-0 flex-1">
          {props.task.title}
        </h4>

        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            class="size-6"
            onClick={() => props.onEdit(props.task)}
          >
            <div class="i-tabler-edit size-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            class="size-6 text-red hover:text-red"
            onClick={() => props.onDelete(props.task)}
          >
            <div class="i-tabler-trash size-3.5" />
          </Button>
        </div>
      </div>

      {props.task.description && (
        <p class="text-xs text-muted-foreground mt-1.5 line-clamp-2 break-words">
          {props.task.description}
        </p>
      )}
    </div>
  );
};
