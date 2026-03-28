export type KanbanTaskStatus = 'todo' | 'in-progress' | 'done';

export interface KanbanTask {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  status: KanbanTaskStatus;
  displayOrder: number;
}
