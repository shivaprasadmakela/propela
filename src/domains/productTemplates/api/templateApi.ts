import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface ProductTemplate {
  id?: number;
  code?: string;
  name: string;
  description: string;
  productTemplateType: 'GENERAL';
  isActive: boolean;
}

export interface PaginatedTemplateResponse {
  content: ProductTemplate[];
  totalElements: number;
  last: boolean;
}

export const templateApi = {
  fetchTemplates: (page = 0, size = 100): Promise<PaginatedTemplateResponse> => {
    return httpClient.get<PaginatedTemplateResponse>(
      `${ENDPOINTS.PRODUCT_TEMPLATES.EAGER}?eager=true&sort=createdAt,desc&size=${size}&page=${page}`
    );
  },
  fetchTemplateByCode: (code: string): Promise<ProductTemplate> => {
    return httpClient.get<ProductTemplate>(ENDPOINTS.PRODUCT_TEMPLATES.BY_CODE(code));
  },
  createTemplate: (template: Partial<ProductTemplate>): Promise<ProductTemplate> => {
    return httpClient.post<ProductTemplate>(ENDPOINTS.PRODUCT_TEMPLATES.LIST, template);
  },
  updateTemplate: (id: number, template: Partial<ProductTemplate>): Promise<ProductTemplate> => {
    return httpClient.patch<ProductTemplate>(`${ENDPOINTS.PRODUCT_TEMPLATES.LIST}/${id}`, template);
  },
  deleteTemplate: (id: number): Promise<void> => {
    return httpClient.delete<void>(`${ENDPOINTS.PRODUCT_TEMPLATES.LIST}/${id}`);
  }
};
