export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  project: string;
  plannedMinutes: number;
  spentMinutes: number;
  deadline: string; // ISO string
  status: TaskStatus;
  startTime?: number; // UNIX-время, если таймер работает
}

export interface BoardData {
  tasks: Task[];
}
