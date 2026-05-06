import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface Source {
  id?: number;
  name: string;
  displayOrder: number;
  active: boolean;
  children: Source[];
  parentId?: number;
}

export const sourceApi = {
  fetchSources: (): Promise<Source[]> => {
    return httpClient.get<Source[]>(`${ENDPOINTS.SOURCES.LIST}`, {
      headers: {
        appcode: 'leadzump'
      }
    });
  },
  saveSources: (sources: Source[]): Promise<void> => {
    return httpClient.post(ENDPOINTS.SOURCES.SAVE, sources, {
      headers: {
        appcode: 'leadzump'
      }
    });
  }
};
