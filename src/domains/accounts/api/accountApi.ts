import { ENDPOINTS } from "@/services/endpoints";
import { httpClient } from "@/services/httpClient";

export interface User {
    id: number;
    firstName?: string;
    lastName?: string;
    name?: string;
    code?: string;
}

export interface AccountEntity {
    id: number;
    appCode: string;
    clientCode: string;
    code: string;
    name: string;
    version: number;
    dialCode?: number;
    phoneNumber?: string;
    email?: string;
    source?: string;
    subSource?: string;
    parentOwnerId?: {
        id: number;
        name?: string;
    };
    createdBy?: User;
    createdAt?: number;
    updatedBy?: User;
    updatedAt?: number;
}

export interface AccountQueryPayload {
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

export interface PaginatedAccountResponse {
    content: AccountEntity[];
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

export const accountApi = {
    fetchAccounts: (payload: AccountQueryPayload): Promise<PaginatedAccountResponse> => {
        return httpClient.post<PaginatedAccountResponse>(ENDPOINTS.ACCOUNTS.QUERY_EAGER, payload);
    },
};