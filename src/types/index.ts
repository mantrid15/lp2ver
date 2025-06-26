export interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface SubTask {
    id: string;
    taskId: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
}

export interface TaskStore {
    tasks: Task[];
    subTasks: SubTask[];
    selectedTaskId: string | null;
}