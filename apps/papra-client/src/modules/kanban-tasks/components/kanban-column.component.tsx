import type { Component, JSX } from 'solid-js';
import type { KanbanTask, KanbanTaskStatus } from '../kanban-tasks.types';
import { createSignal, For, Show } from 'solid-js';
import { KanbanCard } from './kanban-card.component';

export const KanbanColumn: Component<{
  status: KanbanTaskStatus;
  title: string;
  icon: string;
  color: string;
  tasks: KanbanTask[];
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
  onDragStart: (e: DragEvent, task: KanbanTask) => void;
  onDrop: (e: DragEvent, status: KanbanTaskStatus) => void;
  headerAction?: JSX.Element;
}> = (props) => {
  const [isDragOver, setIsDragOver] = createSignal(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    props.onDrop(e, props.status);
  };

  return (
    <div
      class="flex flex-col min-w-64 flex-1"
      classList={{
        'rounded-lg': isDragOver(),
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <div class={`${props.icon} size-4.5`} style={{ color: props.color }} />
          <h3 class="text-sm font-semibold">{props.title}</h3>
          <span class="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {props.tasks.length}
          </span>
        </div>
        {props.headerAction}
      </div>

      <div
        class="flex flex-col gap-2 flex-1 rounded-lg p-2 min-h-32 transition-colors"
        classList={{
          'bg-muted/30': !isDragOver(),
          'bg-primary/10 border-2 border-dashed border-primary/30': isDragOver(),
        }}
      >
        <For each={props.tasks}>
          {task => (
            <KanbanCard
              task={task}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
              onDragStart={props.onDragStart}
            />
          )}
        </For>

        <Show when={props.tasks.length === 0 && !isDragOver()}>
          <div class="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
            No tasks
          </div>
        </Show>
      </div>
    </div>
  );
};
