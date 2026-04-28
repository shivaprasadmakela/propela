import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface TaskUser {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  code?: string;
}

export interface TaskEntityRef {
  id: number;
  name: string;
  code: string;
}

export interface TaskEntity {
  id: number;
  appCode: string;
  clientCode: string;
  code: string;
  name: string;
  version: number;
  contentEntitySeries: string;
  ownerId?: TaskEntityRef;
  ticketId?: TaskEntityRef;
  taskTypeId?: TaskEntityRef;
  dueDate?: number;
  taskPriority?: string;
  isCompleted?: boolean;
  isCancelled?: boolean;
  isDelayed?: boolean;
  hasReminder?: boolean;
  tempActive?: boolean;
  isActive?: boolean;
  createdBy?: TaskUser;
  createdAt?: number;
  updatedAt?: number;
}

export interface PaginatedTasksResponse {
  content: TaskEntity[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface TasksQueryPayload {
  condition: {
    conditions: any[];
    operator: 'AND' | 'OR';
  };
  eager: boolean;
  size: number;
  page: number;
  sort: Array<{
    property: string;
    direction: 'ASC' | 'DESC';
  }>;
  eagerFields: string[];
}

export const tasksApi = {
  fetchTasks: (payload: TasksQueryPayload): Promise<PaginatedTasksResponse> => {
    return httpClient.post<PaginatedTasksResponse>(ENDPOINTS.TASKS.QUERY_EAGER, payload);
  },
  completeTask: async (taskId: number): Promise<void> => {
    const formData = new FormData();
    formData.append('completed', 'true');
    return httpClient.put(ENDPOINTS.TASKS.COMPLETE(taskId), formData);
  },
};
