import { httpClient } from "@/services/httpClient";
import { ENDPOINTS } from "@/services/endpoints";

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
  statusCode: "ACTIVE" | "INACTIVE" | "DELETED";
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
  fetchUsers: async (page = 0, size = 50): Promise<UserQueryResponse> => {
    try {
      const res = await httpClient.post<UserQueryResponse>(
        "/api/security/users/query?fetchDesignation=true&fetchReportingTo=true&fetchProfiles=true",
        {
          condition: {
            conditions: [],
            operator: "AND",
          },
          size,
          page,
          sort: [
            { property: "statusCode", direction: "ASC" },
            { property: "createdAt", direction: "DESC" },
          ],
        }
      );
      if (res && res.content && res.content.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Primary users query failed, trying ticket users query fallback:", e);
    }

    try {
      const fallbackRes = await httpClient.post<any>(ENDPOINTS.USERS.QUERY, {});
      if (fallbackRes && Array.isArray(fallbackRes)) {
        return {
          content: fallbackRes.map((u: any) => ({
            id: u.id,
            firstName: u.firstName || u.name || "User",
            lastName: u.lastName || "",
            emailId: u.emailId || u.email || "",
            phoneNumber: u.phoneNumber || u.phone || "",
            statusCode: u.statusCode || "ACTIVE",
            createdAt: Date.now(),
          })),
          totalElements: fallbackRes.length,
          totalPages: 1,
          size: fallbackRes.length,
          number: 0,
        };
      } else if (fallbackRes && fallbackRes.content) {
        return fallbackRes;
      }
    } catch (err) {
      console.error("All user queries failed:", err);
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size,
      number: page,
    };
  },
};
