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
};
