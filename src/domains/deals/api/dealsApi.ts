import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

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
  expiresOn?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface PaginatedDealsResponse {
  content: DealEntity[];
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

export interface DealsQueryPayload {
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

export const dealsApi = {
  fetchDeals: (payload: DealsQueryPayload): Promise<PaginatedDealsResponse> => {
    return httpClient.post<PaginatedDealsResponse>(ENDPOINTS.DEALS.QUERY_EAGER, payload);
  },
};
