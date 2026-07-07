import { httpClient } from "@/services/httpClient";
import { ENDPOINTS } from "@/services/endpoints";
import { ENV } from "@/env";

export interface DealUser {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  code?: string;
}

export interface DealStageNode {
  id: number;
  name: string;
  code: string;
}

export interface DealEntity {
  id: number;
  appCode: string;
  clientCode: string;
  code: string;
  name: string;
  firstName?: string;
  lastName?: string;
  campaign_name?: string;
  version: number;
  ownerId?: DealUser;
  assignedUserId?: DealUser;
  dialCode?: number;
  phoneNumber?: string;
  email?: string;
  stage?: DealStageNode;
  status?: DealStageNode;
  source?: string;
  subSource?: string;
  tag?: string;
  productId?: DealStageNode & { createdBy?: number };
  productTemplateId?: number | { id: number };
  createdBy?: DealUser;
  updatedBy?: number | DealUser;
  nextFollowUp?: number;
  expiresOn?: number;
  createdAt?: number;
  updatedAt?: number;
  description?: string;
  metaData?: Record<string, any>;
}

export interface PaginatedDealsResponse {
  content: DealEntity[];
  pageable: Record<string, any>;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Record<string, any>;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface DealsQueryPayload {
  condition: {
    conditions: Record<string, any>[];
    operator: "AND" | "OR";
  };
  eager: boolean;
  size: number;
  page: number;
  sort: Array<{
    property: string;
    direction: "ASC" | "DESC";
  }>;
  eagerFields: string[];
}

export interface NoteEntity {
  id: number;
  content: string;
  createdBy: DealUser;
  createdAt: number;
}

export interface TaskEntity {
  id: number;
  name: string;
  taskTypeId: { name: string };
  dueDate: number;
  taskPriority: string;
  isCompleted: boolean;
  createdBy: DealUser;
  createdAt: number;
}

export interface ActivityActor {
  id: number;
  firstName?: string;
  lastName?: string;
  emailId?: string;
  statusCode?: string;
}

export interface ActivityValueRef {
  id?: number;
  value?: string;
}

export interface ActivityNote {
  id: number;
  content?: string;
  createdAt?: number;
  updatedAt?: number;
  hasAttachment?: boolean;
}

export interface DealActivity {
  id: number;
  description?: string;
  comment?: string;
  activityDate?: number;
  activityAction?: string;
  actorId?: ActivityActor | number;
  objectData?: {
    user?: ActivityValueRef;
    stage?: ActivityValueRef;
    _stage?: ActivityValueRef;
    status?: ActivityValueRef;
    tag?: string;
    _tag?: string;
    assignedUserId?: ActivityValueRef;
    _assignedUserId?: ActivityValueRef;
    noteId?: number;
    dateTime?: number;
    ticketId?: number;
    Note?: ActivityNote;
    entity?: string;
    [key: string]: unknown;
  };
  noteId?: ActivityNote;
  createdAt?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable?: Record<string, unknown>;
  totalPages?: number;
  totalElements?: number;
  last?: boolean;
  size?: number;
  number?: number;
  sort?: Record<string, unknown>;
  numberOfElements?: number;
  first?: boolean;
  empty?: boolean;
}

export const dealsApi = {
  fetchDeals: (payload: DealsQueryPayload): Promise<PaginatedDealsResponse> => {
    return httpClient.post<PaginatedDealsResponse>(
      ENDPOINTS.DEALS.QUERY_EAGER,
      payload,
    );
  },
  fetchDealByCode: async (code: string): Promise<DealEntity | null> => {
    const eagerFields = [
      "id",
      "name",
      "productTemplateId",
      "order",
      "platform",
      "isSuccess",
      "firstName",
      "lastName",
      "emailId",
      "phoneNumber",
      "clientId",
      "statusCode",
    ];
    const params = new URLSearchParams();
    params.append("eager", "true");
    eagerFields.forEach((field) => params.append("eagerField", field));

    return httpClient.get<DealEntity>(
      `${ENDPOINTS.DEALS.BY_CODE(code)}?${params.toString()}`,
    );
  },
  createDeal: (data: {
    name: string;
    phoneNumber: string;
    email: string;
    productId: number;
    source: string;
    subSource: string;
  }): Promise<Record<string, any>> => {
    return httpClient.post(ENDPOINTS.DEALS.CREATE, data, {
      headers: {
        appcode: "leadzump",
      },
    });
  },
  updateDealStage: (dealId: number, stageId: number): Promise<void> => {
    return httpClient.patch(`/api/entity/processor/tickets/${dealId}`, {
      stage: { id: stageId },
    });
  },
  updateDeal: (dealId: number, data: Partial<DealEntity>): Promise<void> => {
    return httpClient.patch(`/api/entity/processor/tickets/${dealId}`, data);
  },
  saveDealByCode: (code: string, data: any): Promise<void> => {
    return httpClient.put(ENDPOINTS.DEALS.UPDATE_BY_CODE(code), data);
  },
  fetchUsers: (payload: any): Promise<any> => {
    return httpClient.post(ENDPOINTS.USERS.QUERY, payload);
  },
  fetchNotes: (ticketId: number): Promise<{ content: NoteEntity[] }> => {
    const params = new URLSearchParams({
      ticketId: String(ticketId),
      eager: "true",
      sort: "createdAt,DESC",
      size: "20",
    });
    return httpClient.get(`${ENDPOINTS.NOTES.EAGER}?${params.toString()}`);
  },
  fetchTasks: (ticketId: number): Promise<{ content: TaskEntity[] }> => {
    const params = new URLSearchParams({
      ticketId: String(ticketId),
      eager: "true",
      sort: "createdAt,DESC",
      size: "20",
    });
    return httpClient.get(`${ENDPOINTS.TASKS.EAGER}?${params.toString()}`);
  },
  fetchCallLogs: (phoneNumber: string): Promise<{ content: any[] }> => {
    return httpClient.post(ENDPOINTS.CALL_LOGS.QUERY, {
      size: 20,
      eager: true,
      eagerFields: ["userId", "firstName", "lastName"],
      condition: {
        field: "customerPhoneNumber",
        operator: "EQUALS",
        value: phoneNumber,
      },
    });
  },
  fetchActivities: (
    ticketId: number,
  ): Promise<PaginatedResponse<DealActivity>> => {
    const params = new URLSearchParams({
      eager: "true",
      sort: "id,DESC",
      size: "20",
    });
    return httpClient.get(
      `${ENDPOINTS.ACTIVITIES.TICKETS_EAGER(ticketId)}?${params.toString()}`,
    );
  },
  flattenDealPayload: (deal: DealEntity): any => {
    return {
      ...deal,
      ownerId:
        typeof deal.ownerId === "object" ? deal.ownerId?.id : deal.ownerId,
      assignedUserId:
        typeof deal.assignedUserId === "object"
          ? deal.assignedUserId?.id
          : deal.assignedUserId,
      productId:
        typeof deal.productId === "object"
          ? deal.productId?.id
          : deal.productId,
      stage: typeof deal.stage === "object" ? deal.stage?.id : deal.stage,
      status: typeof deal.status === "object" ? deal.status?.id : deal.status,
      productTemplateId:
        typeof deal.productTemplateId === "object"
          ? deal.productTemplateId?.id
          : deal.productTemplateId,
      updatedBy:
        typeof deal.updatedBy === "object"
          ? (deal.updatedBy as any)?.id
          : deal.updatedBy,
      updatedAt: Math.floor(Date.now() / 1000),
    };
  },
  downloadSpreadsheet: async (payload: {
    name: string;
    type: 'XLSX' | 'CSV';
    headers: string[];
    data: any[];
    downloadable: boolean;
    skipHeader: boolean;
  }): Promise<Blob> => {
    const token = localStorage.getItem('accessToken');
    const clientCode = localStorage.getItem('clientCode');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'appcode': 'leadzump',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (clientCode) {
      headers['clientcode'] = clientCode;
    }

    const baseURL = ENV.API_BASE_URL.endsWith('/') ? ENV.API_BASE_URL.slice(0, -1) : ENV.API_BASE_URL;
    const response = await fetch(`${baseURL}/api/core/spreadsheet`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to download spreadsheet`);
    }

    return response.blob();
  },
};
