import { getSalesReps } from "@/services/api/salesRepService";
// Report service using ApperClient for database operations
const API_DELAY = 300;

// Initialize ApperClient
const getApperClient = () => {
  const { ApperClient } = window.ApperSDK;
  return new ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
  });
};

// Helper function to simulate API delay for consistency
const simulateAPICall = (delay = API_DELAY) => 
  new Promise(resolve => setTimeout(resolve, delay));
// Utility function to clean website URLs by removing trailing slash
const cleanWebsiteUrl = (url) => {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Get website URL activity with filtering options
export const getWebsiteUrlActivity = async (filters = {}) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Build filters array for the query
    const whereFilters = [];
    
    // Filter by date range
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date('1900-01-01');
      const end = filters.endDate ? new Date(filters.endDate) : new Date('2100-12-31');
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      whereFilters.push({
        FieldName: "created_at_c",
        Operator: "GreaterThanOrEqualTo",
        Values: [start.toISOString()]
      });
      whereFilters.push({
        FieldName: "created_at_c",
        Operator: "LessThanOrEqualTo",
        Values: [end.toISOString()]
      });
    }
    
    // Filter by specific date (for today, yesterday, etc.)
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      whereFilters.push({
        FieldName: "created_at_c",
        Operator: "GreaterThanOrEqualTo",
        Values: [startOfDay.toISOString()]
      });
      whereFilters.push({
        FieldName: "created_at_c",
        Operator: "LessThan",
        Values: [endOfDay.toISOString()]
      });
    }
    
    // Filter by user/sales rep
    if (filters.addedBy) {
      whereFilters.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [parseInt(filters.addedBy)]
      });
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      whereFilters.push({
        FieldName: "website_url_c",
        Operator: "Contains",
        Values: [term]
      });
    }
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "arr_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "funding_type_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: whereFilters.length > 0 ? whereFilters : undefined,
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch website URL activity:', response.message);
      return {
        data: [],
        summary: {
          totalUrls: 0,
          totalArr: 0,
          byStatus: {},
          byCategory: {}
        }
      };
    }
    
    const leads = response.data || [];
    
    // Transform to match expected format
    const transformedLeads = leads.map(lead => ({
      Id: lead.Id,
      websiteUrl: cleanWebsiteUrl(lead.website_url_c || ''),
      category: lead.category_c || '',
      arr: lead.arr_c || 0,
      status: lead.status_c || '',
      fundingType: lead.funding_type_c || '',
      addedByName: lead.added_by_c?.Name || 'Unknown',
      createdAt: lead.created_at_c || new Date().toISOString()
    }));
    
    return {
      data: transformedLeads,
      summary: {
        totalUrls: transformedLeads.length,
        totalArr: transformedLeads.reduce((sum, lead) => sum + (lead.arr || 0), 0),
        byStatus: getStatusSummary(transformedLeads),
        byCategory: getCategorySummary(transformedLeads)
      }
    };
  } catch (error) {
    console.error('Error fetching website URL activity:', error.message);
    return {
      data: [],
      summary: {
        totalUrls: 0,
        totalArr: 0,
        byStatus: {},
        byCategory: {}
      }
    };
}
};

// Get activity for a specific date
export const getActivityByDate = async (date) => {
  return await getWebsiteUrlActivity({ date });
};
// Get activity for a specific user
export const getActivityByUser = async (userId) => {
  return await getWebsiteUrlActivity({ addedBy: userId });
};

// Get quick date filters (today, yesterday, this week, etc.)
export const getQuickDateFilters = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return {
    today: today.toISOString().split('T')[0],
    yesterday: yesterday.toISOString().split('T')[0],
    thisWeekStart: thisWeekStart.toISOString().split('T')[0],
    thisWeekEnd: today.toISOString().split('T')[0],
    lastWeekStart: lastWeekStart.toISOString().split('T')[0],
    lastWeekEnd: lastWeekEnd.toISOString().split('T')[0],
    thisMonthStart: thisMonthStart.toISOString().split('T')[0],
    thisMonthEnd: today.toISOString().split('T')[0]
  };
};

// Get all sales reps for filtering
export const getSalesRepsForFilter = async () => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } }
      ],
      orderBy: [
        { fieldName: "Name", sorttype: "ASC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('sales_rep_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch sales reps for filter:', response.message);
      return [];
    }
    
    const salesReps = response.data || [];
    
    // Transform to match expected format
    return salesReps.map(rep => ({
      Id: rep.Id,
      name: rep.Name
    }));
  } catch (error) {
    console.error('Error fetching sales reps for filter:', error.message);
    return [];
  }
};

// Helper functions
const getStatusSummary = (data) => {
  const summary = {};
  data.forEach(lead => {
    summary[lead.status] = (summary[lead.status] || 0) + 1;
  });
  return summary;
};

const getCategorySummary = (data) => {
  const summary = {};
  data.forEach(lead => {
    summary[lead.category] = (summary[lead.category] || 0) + 1;
  });
  return summary;
};

// Get daily website URLs for a specific sales rep - only fresh leads
export const getDailyWebsiteUrls = async (salesRepId, date) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    // Build filters
    const filters = [
      {
        FieldName: "created_at_c",
        Operator: "GreaterThanOrEqualTo",
        Values: [startOfDay.toISOString()]
      },
      {
        FieldName: "created_at_c",
        Operator: "LessThan",
        Values: [endOfDay.toISOString()]
      }
    ];
    
    // Filter by sales rep if specified
    if (salesRepId) {
      filters.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [salesRepId]
      });
    }
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: filters,
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch daily website URLs:', response.message);
      return [];
    }
    
    const leads = response.data || [];
    
    // Transform to match expected format and filter to fresh leads
    const transformedLeads = leads.map(lead => ({
      Id: lead.Id,
      websiteUrl: cleanWebsiteUrl(lead.website_url_c || ''),
      category: lead.category_c || '',
      status: lead.status_c || '',
      addedBy: lead.added_by_c?.Id || lead.added_by_c,
      addedByName: lead.added_by_c?.Name || 'Unknown',
      createdAt: lead.created_at_c || new Date().toISOString()
    }));
    
    // Filter to only include fresh leads (leads that were created on this day)
    return transformedLeads;
  } catch (error) {
    console.error('Error fetching daily website URLs:', error.message);
    return [];
  }
};

// Re-export sales reps for easy access
export { getSalesReps } from './salesRepService';

// Export lead data for external use (CSV, etc.)
export const exportWebsiteUrlData = async (filters = {}) => {
  const result = await getWebsiteUrlActivity(filters);
  
  return result.data.map(lead => ({
    'Website URL': cleanWebsiteUrl(lead.websiteUrl),
    'Category': lead.category,
    'ARR': `$${(lead.arr / 1000000).toFixed(1)}M`,
    'Status': lead.status,
    'Funding Type': lead.fundingType,
    'Added By': lead.addedByName,
    'Date Added': new Date(lead.createdAt).toLocaleDateString()
  }));
};