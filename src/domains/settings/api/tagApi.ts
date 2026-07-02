import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface Tag {
  id?: number;
  appCode?: string;
  clientCode?: string;
  name: string;
  active: boolean;
  color?: string;
  icon?: string;
  version?: number;
}

export const tagApi = {
  fetchTags: (onlyActive: boolean = false): Promise<Tag[]> => {
    return httpClient.get<Tag[]>(`${ENDPOINTS.TAGS.LIST}?onlyActive=${onlyActive}`, {
      headers: {
        appcode: 'leadzump'
      }
    });
  },
  saveTags: (tags: Tag[]): Promise<Tag[]> => {
    return httpClient.post<Tag[]>(ENDPOINTS.TAGS.SAVE, tags, {
      headers: {
        appcode: 'leadzump'
      }
    });
  }
};
