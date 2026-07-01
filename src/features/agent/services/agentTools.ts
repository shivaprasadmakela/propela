import { dealsApi, type DealEntity, type TaskEntity, type NoteEntity, type DealActivity } from '@/domains/deals/api/dealsApi';
import { getDateRange } from '@/shared/utils/dateUtils';

export interface SearchDealsArgs {
  search?: string;
  stageName?: string;
  timeframe?: 'today' | 'yesterday' | 'this_week' | 'all';
  assignedUserName?: string;
  source?: string;
  productName?: string;
}

export interface AnalyticsArgs {
  stageName?: string;
  assignedUserName?: string;
  timeframe?: 'today' | 'yesterday' | 'this_week' | 'all';
  productName?: string;
}

export const agentTools = {
  /**
   * Fetch/search deals with filters (search name/code, stage name, timeframe, assignee, source, or product).
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
        size: 100, // Fetch up to 100 deals to allow robust client filtering
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

      // 4. Assignee filtering (perform client-side in memory to ensure robust database support)
      if (args.assignedUserName && args.assignedUserName.trim() && results.length > 0) {
        const queryAssignee = args.assignedUserName.toLowerCase().trim();
        results = results.filter(deal => {
          const user = deal.assignedUserId;
          if (!user) return false;
          const fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`.toLowerCase();
          return fullName.includes(queryAssignee);
        });
      }

      // 5. Source filtering (perform client-side in memory)
      if (args.source && args.source.trim() && results.length > 0) {
        const querySource = args.source.toLowerCase().trim();
        results = results.filter(deal => 
          deal.source?.toLowerCase().includes(querySource)
        );
      }

      // 6. Product filtering (perform client-side in memory)
      if (args.productName && args.productName.trim() && results.length > 0) {
        const queryProduct = args.productName.toLowerCase().trim();
        results = results.filter(deal => 
          deal.productId?.name?.toLowerCase().includes(queryProduct)
        );
      }

      return results;
    } catch (error) {
      console.error('Agent tool [list_deals] failed:', error);
      throw error;
    }
  },

  /**
   * Get analytics on deal counts grouped by marketing source (e.g., Google, Facebook, Direct) for a specific workflow stage.
   */
  get_deals_by_source_analytics: async (args: AnalyticsArgs): Promise<Record<string, number>> => {
    try {
      const conditions = Array(15).fill(null).map(() => ({
        conditions: [] as any[],
        operator: 'OR'
      }));

      // Timeframe filtering in Slot 1
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
        size: 200, // Fetch up to 200 deals to get good statistics
        page: 0,
        sort: [{ property: 'createdAt', direction: 'DESC' }],
        eagerFields: ['stage', 'status', 'source', 'assignedUserId', 'productId', 'createdAt'],
      });

      let results = response.content || [];

      // Filter by stage name in memory
      if (args.stageName && args.stageName.trim() && results.length > 0) {
        const queryStage = args.stageName.toLowerCase().trim();
        results = results.filter(deal => 
          deal.stage?.name?.toLowerCase().includes(queryStage) || 
          deal.status?.name?.toLowerCase().includes(queryStage)
        );
      }

      // Filter by assignee in memory
      if (args.assignedUserName && args.assignedUserName.trim() && results.length > 0) {
        const queryAssignee = args.assignedUserName.toLowerCase().trim();
        results = results.filter(deal => {
          const user = deal.assignedUserId;
          if (!user) return false;
          const fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`.toLowerCase();
          return fullName.includes(queryAssignee);
        });
      }

      // Filter by product in memory
      if (args.productName && args.productName.trim() && results.length > 0) {
        const queryProduct = args.productName.toLowerCase().trim();
        results = results.filter(deal => 
          deal.productId?.name?.toLowerCase().includes(queryProduct)
        );
      }

      // Group and count by source
      const counts: Record<string, number> = {};
      for (const deal of results) {
        const src = deal.source || 'Unknown';
        counts[src] = (counts[src] || 0) + 1;
      }

      return counts;
    } catch (error) {
      console.error('Agent tool [get_deals_by_source_analytics] failed:', error);
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
  },

  /**
   * Fetch activity logs linked to a deal.
   */
  list_deal_activities: async (args: { dealId: number }): Promise<DealActivity[]> => {
    try {
      const response = await dealsApi.fetchActivities(args.dealId);
      return response.content || [];
    } catch (error) {
      console.error('Agent tool [list_deal_activities] failed:', error);
      throw error;
    }
  }
};
