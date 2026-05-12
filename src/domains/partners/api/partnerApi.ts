import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface PartnerEntity {
  id: number;
  createdAt: number;
  updatedAt: number;
  appCode: string;
  clientCode: string;
  code: string;
  name: string;
  clientName: string;
  clientStatusCode: string;
  activeUsers: number;
  totalTickets: number;
  userNames: string;
  userPhones: string;
  clientManagerIds: string;
  partnerVerificationStatus: string;
  dnc: boolean;
  active: boolean;
  clientId: {
    id: number;
    code: string;
    name: string;
    owners: Array<{
      id: number;
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
    }>;
    clientManagers: Array<{
      id: number;
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
    }>;
  };
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface PaginatedPartnersResponse {
  content: PartnerEntity[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface PartnersQueryPayload {
  condition: {
    conditions: any[];
    operator: 'AND' | 'OR';
  };
  size: number;
  page: number;
  sort: {
    property: string;
    direction: 'ASC' | 'DESC';
  };
}

export const partnerApi = {
  fetchPartners: (payload: PartnersQueryPayload): Promise<PaginatedPartnersResponse> => {
    return httpClient.post<PaginatedPartnersResponse>(
      `${ENDPOINTS.PARTNERS.QUERY}?fetchClientManagers=true&fetchOwners=true`,
      payload
    );
  },
};
