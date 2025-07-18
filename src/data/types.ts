export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'urgent' | 'secondary' | 'postpone' | undefined;


export interface Task {
  id: string;
  title: string;
  project: string;
  plannedMinutes: number;
  spentMinutes: number;
  deadline: string;
  status: TaskStatus;
  startTime?: number;
  priority?: TaskPriority;
   started?: boolean; 
}


export interface BoardData {
  tasks: Task[];
}
