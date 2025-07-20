export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'urgent' | 'secondary' | 'postpone' | undefined;

export type TaskRepeatType = 'daily' | 'weekly' | 'monthly';

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
  createdAt?: string;

  // 💡 Повторяемость
  repeat?: boolean; // включён ли повтор вообще
  repeatInterval?: TaskRepeatType; // daily | weekly | monthly
  repeatDay?: number; // 0 = Воскресенье, 1 = Понедельник и т.д. (для weekly)
  repeatDate?: number; // 1-31 (для monthly)
}

export interface BoardData {
  tasks: Task[];
}