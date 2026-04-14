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
    version: number;
    productTemplateId?: {
        id: number;
        productTemplateWalkInFormId?: number;
    };
    productWalkInFormId?: {
        id: number;
    };
    logoFileDetail?: FileDetail;
    bannerFileDetail?: FileDetail;
    tempActive: boolean;
    isActive: boolean;
    forPartner: boolean;
    overrideCTemplate: boolean;
    overrideRuTemplate: boolean;
    createdBy?: {
        id: number;
    };
    createdAt?: number;
    updatedBy?: {
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
};
