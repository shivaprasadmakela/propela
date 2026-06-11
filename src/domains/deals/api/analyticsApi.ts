import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface AnalyticsPayload {
  includeTotal: boolean;
  includePercentage: boolean;
  includeZero: boolean;
  includeAll: boolean;
  timePeriod: 'WEEKS' | 'MONTHS' | 'DAYS';
  startDate: number;
  endDate: number;
  timezone: string;
  stageIds: number[];
  userIds?: number[];
  productIds?: number[];
}

export interface DatePair {
  first: number;
  second: number;
  timezone: string;
  zonedFirst: number;
  zonedSecond: number;
}

export interface StatusCountValue {
  count: number;
  percentage: number;
}

export interface StatusCountPerCount {
  id: string;
  value: StatusCountValue;
}

export interface StatusCountItem {
  name: string;
  perCount: StatusCountPerCount[];
}

export interface AnalyticsPeriodData {
  datePair: DatePair;
  statusCount: StatusCountItem[];
}

export interface AnalyticsStageCountResponse {
  data: AnalyticsPeriodData[];
}

export const analyticsApi = {
  fetchStageCounts: async (payload: AnalyticsPayload, page = 0, size = 50): Promise<AnalyticsStageCountResponse> => {
    return httpClient.post<AnalyticsStageCountResponse>(
      `${ENDPOINTS.ANALYTICS.STAGE_COUNTS}?page=${page}&size=${size}`,
      payload
    );
  },
  fetchAssignedUsersStageCounts: async (
    payload: {
      includeTotal: boolean;
      includeZero: boolean;
      includeAll: boolean;
      onlyCurrentStageStatus?: boolean;
      stageIds?: number[];
      userIds?: number[];
      productIds?: number[];
    },
    page = 0,
    size = 25
  ): Promise<any> => {
    return httpClient.post<any>(
      `${ENDPOINTS.ANALYTICS.ASSIGNED_USERS}?page=${page}&size=${size}`,
      payload
    );
  }
};
