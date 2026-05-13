import { ENDPOINTS } from "@/services/endpoints";
import { httpClient } from "@/services/httpClient";

export interface FileDetail {
    id: number;
    name: string;
    size: number;
    filePath: string;
    url: string;
    createdDate: number;
    lastModifiedTime: number;
    type: string;
    fileName: string;
    directory: boolean;
}

export interface ProductEntity {
    id: number;
    appCode: string;
    clientCode: string;
    code: string;
    name: string;
    description?: string;
    version: number;
    productTemplateId?: number | {
        id: number;
        productTemplateWalkInFormId?: number;
    };
    productWalkInFormId?: {
        id: number;
    };
    logoFileDetail?: FileDetail;
    bannerFileDetail?: FileDetail;
    tempActive?: boolean;
    isActive?: boolean;
    active?: boolean;
    forPartner?: boolean;
    overrideCTemplate?: boolean;
    overrideRuTemplate?: boolean;
    createdBy?: number | {
        id: number;
    };
    createdAt?: number;
    updatedBy?: number | {
        id: number;
    };
    updatedAt?: number;
}

export interface ProductQueryPayload {
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

export interface PaginatedProductResponse {
    content: ProductEntity[];
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

export const productApi = {
    fetchProducts: (payload: ProductQueryPayload): Promise<PaginatedProductResponse> => {
        return httpClient.post<PaginatedProductResponse>(ENDPOINTS.PRODUCTS.QUERY_EAGER, payload);
    },
    fetchProductTemplates: (params: { size?: number; page?: number; sort?: string }): Promise<any> => {
        const queryParams = new URLSearchParams();
        if (params.size) queryParams.append('size', String(params.size));
        if (params.page !== undefined) queryParams.append('page', String(params.page));
        if (params.sort) queryParams.append('sort', params.sort);
        
        return httpClient.get<any>(`${ENDPOINTS.PRODUCT_TEMPLATES.LIST}?${queryParams.toString()}`);
    },
    fetchProductByCode: (code: string): Promise<ProductEntity> => {
        return httpClient.get<ProductEntity>(ENDPOINTS.PRODUCTS.BY_CODE(code));
    },
    updateProduct: (id: number, data: Partial<ProductEntity>): Promise<ProductEntity> => {
        return httpClient.patch<ProductEntity>(ENDPOINTS.PRODUCTS.UPDATE(id), data);
    },
};
