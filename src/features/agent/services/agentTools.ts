import { dealsApi, type DealEntity, type TaskEntity, type NoteEntity } from '@/domains/deals/api/dealsApi';
import { getDateRange } from '@/shared/utils/dateUtils';

export interface SearchDealsArgs {
  search?: string;
  stageName?: string;
  timeframe?: 'today' | 'yesterday' | 'this_week' | 'all';
}

export const agentTools = {
  /**
   * Fetch/search deals with filters (search name/code, stage name, or timeframe).
   */
  list_deals: async (args: SearchDealsArgs): Promise<DealEntity[]> => {
    try {
      // Build a 15-slot array exactly like DealsPage.tsx and DealFilterModal.tsx expects
      const conditions = Array(15).fill(null).map(() => ({
        conditions: [] as any[],
        operator: 'OR'
      }));

      // 1. Search Query (name/code) in Slot 0
      if (args.search && args.search.trim()) {
        conditions[0] = {
          operator: 'OR',
          conditions: [
            { field: 'name', operator: 'CONTAINS', value: args.search.trim() },
            { field: 'code', operator: 'CONTAINS', value: args.search.trim() }
          ]
        };
      }

      // 2. Timeframe filtering in Slot 1
      if (args.timeframe && args.timeframe !== 'all') {
        let preset: string | null = null;
        if (args.timeframe === 'today') preset = 'Today';
        else if (args.timeframe === 'yesterday') preset = 'Yesterday';
        else if (args.timeframe === 'this_week') preset = 'This week';

        if (preset) {
          const range = getDateRange(preset);
          conditions[1] = {
            operator: 'OR',
            conditions: [
              { field: 'createdAt', operator: 'BETWEEN', value: range.start, toValue: range.end }
            ]
          };
        }
      }

      const conditionPayload = {
        operator: 'AND',
        conditions: conditions
      };

      const response = await dealsApi.fetchDeals({
        condition: conditionPayload as any,
        eager: true,
        size: 50,
        page: 0,
        sort: [{ property: 'createdAt', direction: 'DESC' }],
        eagerFields: [
          'name', 'firstName', 'lastName', 'id', 'code', 
          'productId', 'createdBy', 'nextFollowUp', 'stage', 
          'status', 'source', 'subSource', 'tag', 'assignedUserId', 'createdAt'
        ],
      });

      let results = response.content || [];

      // 3. Stage filtering (perform client-side in memory to ensure robust database support)
      if (args.stageName && args.stageName.trim() && results.length > 0) {
        const queryStage = args.stageName.toLowerCase().trim();
        results = results.filter(deal => 
          deal.stage?.name?.toLowerCase().includes(queryStage) || 
          deal.status?.name?.toLowerCase().includes(queryStage)
        );
      }

      return results;
    } catch (error) {
      console.error('Agent tool [list_deals] failed:', error);
      throw error;
    }
  },

  /**
   * Fetch specific deal details by its unique deal code.
   */
  get_deal_details: async (args: { code: string }): Promise<DealEntity | null> => {
    try {
      if (!args.code) throw new Error('Deal code is required');
      return await dealsApi.fetchDealByCode(args.code);
    } catch (error) {
      console.error('Agent tool [get_deal_details] failed:', error);
      throw error;
    }
  },

  /**
   * Create a new deal/ticket.
   */
  create_deal: async (args: {
    name: string;
    phoneNumber: string;
    email: string;
    productId: number;
    source: string;
    subSource: string;
  }): Promise<Record<string, any>> => {
    try {
      return await dealsApi.createDeal(args);
    } catch (error) {
      console.error('Agent tool [create_deal] failed:', error);
      throw error;
    }
  },

  /**
   * Move a deal to a new stage.
   */
  update_deal_stage: async (args: { dealId: number; stageId: number }): Promise<{ success: boolean; message: string }> => {
    try {
      await dealsApi.updateDealStage(args.dealId, args.stageId);
      return { success: true, message: `Deal successfully moved to stage ${args.stageId}` };
    } catch (error) {
      console.error('Agent tool [update_deal_stage] failed:', error);
      throw error;
    }
  },

  /**
   * Fetch tasks linked to a deal.
   */
  list_deal_tasks: async (args: { dealId: number }): Promise<TaskEntity[]> => {
    try {
      const response = await dealsApi.fetchTasks(args.dealId);
      return response.content || [];
    } catch (error) {
      console.error('Agent tool [list_deal_tasks] failed:', error);
      throw error;
    }
  },

  /**
   * Fetch notes linked to a deal.
   */
  list_deal_notes: async (args: { dealId: number }): Promise<NoteEntity[]> => {
    try {
      const response = await dealsApi.fetchNotes(args.dealId);
      return response.content || [];
    } catch (error) {
      console.error('Agent tool [list_deal_notes] failed:', error);
      throw error;
    }
  }
};
