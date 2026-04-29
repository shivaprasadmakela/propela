import { httpClient } from '@/services/httpClient';

export interface UserProfile {
  id: number;
  name: string;
  description: string;
}

export interface UserDesignation {
  id: number;
  name: string;
}

export interface UserEntity {
  id: number;
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
  statusCode: 'ACTIVE' | 'INACTIVE';
  designation?: UserDesignation;
  reportingUser?: {
    firstName: string;
    lastName: string;
  };
  profiles?: UserProfile[];
  createdAt: number;
}

interface UserQueryResponse {
  content: UserEntity[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const usersApi = {
  fetchUsers: async (page = 0, size = 25) => {
    return httpClient.post<UserQueryResponse>(
      '/security/users/query?fetchDesignation=true&fetchReportingTo=true&fetchProfiles=true',
      {
        condition: {
          conditions: [
            { field: 'appCode', value: 'leadzump', operator: 'EQUALS' },
            { field: 'clientId', value: 28, operator: 'EQUALS' }
          ],
          operator: 'AND'
        },
        size,
        page,
        sort: { property: 'createdAt', direction: 'DESC' }
      }
    );
  }
};
