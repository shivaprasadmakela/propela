import { ENDPOINTS } from "@/services/endpoints";
import { httpClient } from "@/services/httpClient";

export interface StageEntity {
  id: number;
  name: string;
  platform: string;
  order: number;
}

export interface PaginatedStageResponse {
  content: StageEntity[];
  totalElements: number;
  totalPages: number;
}

export const stagesApi = {
  fetchStages: (params: { productTemplateId: number }): Promise<PaginatedStageResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('isParent', '1');
    queryParams.append('eager', 'false');
    queryParams.append('productTemplateId', String(params.productTemplateId));
    ['name', 'id', 'order', 'platform'].forEach(field => queryParams.append('field', field));

    return httpClient.get<PaginatedStageResponse>(`${ENDPOINTS.STAGES.EAGER}?${queryParams.toString()}`);
  },
  fetchList: (params: { 
    productTemplateId: number; 
    isParent?: boolean; 
    active?: boolean;
    size?: number;
    sort?: string;
  }): Promise<PaginatedStageResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('productTemplateId', String(params.productTemplateId));
    if (params.isParent !== undefined) queryParams.append('isParent', String(params.isParent));
    if (params.active !== undefined) queryParams.append('active', String(params.active));
    if (params.size) queryParams.append('size', String(params.size));
    if (params.sort) queryParams.append('sort', params.sort);

    return httpClient.get<PaginatedStageResponse>(`${ENDPOINTS.STAGES.LIST}?${queryParams.toString()}`);
  },
};
