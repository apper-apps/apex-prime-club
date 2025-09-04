// Analytics service using ApperClient for database operations
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
// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start: monthStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    default:
      return {
        start: new Date(0),
        end: new Date()
      };
  }
};

export const getLeadsAnalytics = async (period = 'all', userId = 'all') => {
  await simulateAPICall();
  
  try {
    const apperClient = getApperClient();
    
    // Build filters for period and user
    const filters = [];
    
    // Filter by date range if specified
    if (period !== 'all') {
      const { start, end } = getDateRange(period);
      filters.push({
        FieldName: "created_at_c",
        Operator: "GreaterThanOrEqualTo",
        Values: [start.toISOString()]
      });
      filters.push({
        FieldName: "created_at_c",
        Operator: "LessThan",
        Values: [end.toISOString()]
      });
    }
    
    // Filter by user if specified
    if (userId !== 'all') {
      filters.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [parseInt(userId)]
      });
    }
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "team_size_c" } },
        { field: { Name: "arr_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "linkedin_url_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "funding_type_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "follow_up_date_c" } },
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
      console.error('Failed to fetch leads for analytics:', response.message);
      return { leads: [], totalCount: 0 };
    }
    
    const leads = response.data || [];
    
    // Get sales rep data for name mapping
    const salesRepsResponse = await apperClient.fetchRecords('sales_rep_c', {
      fields: [
        { field: { Name: "Name" } }
      ]
    });
    
    const salesReps = salesRepsResponse.success ? salesRepsResponse.data : [];
    
    // Enhance leads with sales rep names
    const leadsWithRepNames = leads.map(lead => ({
      ...lead,
      websiteUrl: lead.website_url_c,
      teamSize: lead.team_size_c,
      arr: lead.arr_c,
      category: lead.category_c,
      linkedinUrl: lead.linkedin_url_c,
      status: lead.status_c,
      fundingType: lead.funding_type_c,
      edition: lead.edition_c,
      followUpDate: lead.follow_up_date_c,
      addedBy: lead.added_by_c?.Id || lead.added_by_c,
      addedByName: lead.added_by_c?.Name || 'Unknown',
      createdAt: lead.created_at_c
    }));
    
    return {
      leads: leadsWithRepNames,
      totalCount: leads.length
    };
  } catch (error) {
    console.error('Error fetching leads analytics:', error.message);
    return { leads: [], totalCount: 0 };
  }
};

export const getDailyLeadsChart = async (userId = 'all', days = 30) => {
  await simulateAPICall(400);
  
  try {
    const apperClient = getApperClient();
    const now = new Date();
    
    // Build filters for user if specified
    const filters = [];
    if (userId !== 'all') {
      filters.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [parseInt(userId)]
      });
    }
    
    const params = {
      fields: [
        { field: { Name: "created_at_c" } },
        { field: { Name: "added_by_c" } }
      ],
      where: filters,
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch leads for chart:', response.message);
      return { chartData: [], categories: [], series: [] };
    }
    
    const leads = response.data || [];
    const chartData = [];
    
    // Generate data for the last X days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter leads for this specific day
      const dayLeads = leads.filter(lead => {
        const leadDate = lead.created_at_c ? lead.created_at_c.split('T')[0] : null;
        return leadDate === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        count: dayLeads.length,
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return {
      chartData,
      categories: chartData.map(item => item.formattedDate),
      series: [
        {
          name: 'New Leads',
          data: chartData.map(item => item.count)
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching daily leads chart:', error.message);
    return { chartData: [], categories: [], series: [] };
  }
};

export const getLeadsMetrics = async (userId = 'all') => {
  await simulateAPICall(250);
  
  try {
    const apperClient = getApperClient();
    
    // Get leads for different periods
    const periods = ['today', 'yesterday', 'week', 'month', 'all'];
    const results = {};
    
    for (const period of periods) {
      const filters = [];
      
      // Add user filter if specified
      if (userId !== 'all') {
        filters.push({
          FieldName: "added_by_c",
          Operator: "EqualTo",
          Values: [parseInt(userId)]
        });
      }
      
      // Add date filter if not 'all'
      if (period !== 'all') {
        const { start, end } = getDateRange(period);
        filters.push({
          FieldName: "created_at_c",
          Operator: "GreaterThanOrEqualTo",
          Values: [start.toISOString()]
        });
        filters.push({
          FieldName: "created_at_c",
          Operator: "LessThan",
          Values: [end.toISOString()]
        });
      }
      
      const params = {
        fields: [
          { field: { Name: "status_c" } },
          { field: { Name: "category_c" } },
          { field: { Name: "created_at_c" } }
        ],
        where: filters
      };
      
      const response = await apperClient.fetchRecords('lead_c', params);
      results[period] = response.success ? response.data : [];
    }
    
    // Calculate metrics
    const todayCount = results.today.length;
    const yesterdayCount = results.yesterday.length;
    const weekCount = results.week.length;
    const monthCount = results.month.length;
    
    // Calculate percentage changes
    const todayTrend = yesterdayCount === 0 ? 100 : 
      Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
    
    // Get status distribution for all filtered leads
    const statusCounts = results.all.reduce((acc, lead) => {
      const status = lead.status_c || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Get category distribution
    const categoryCounts = results.all.reduce((acc, lead) => {
      const category = lead.category_c || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      metrics: {
        today: {
          count: todayCount,
          trend: todayTrend,
          label: 'Today'
        },
        yesterday: {
          count: yesterdayCount,
          label: 'Yesterday'
        },
        week: {
          count: weekCount,
          label: 'This Week'
        },
        month: {
          count: monthCount,
          label: 'This Month'
        }
      },
      statusDistribution: statusCounts,
      categoryDistribution: categoryCounts,
      totalLeads: results.all.length
    };
  } catch (error) {
    console.error('Error fetching leads metrics:', error.message);
    return {
      metrics: {
        today: { count: 0, trend: 0, label: 'Today' },
        yesterday: { count: 0, label: 'Yesterday' },
        week: { count: 0, label: 'This Week' },
        month: { count: 0, label: 'This Month' }
      },
      statusDistribution: {},
      categoryDistribution: {},
      totalLeads: 0
    };
  }
};

export const getUserPerformance = async () => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Get sales reps data
    const salesRepsResponse = await apperClient.fetchRecords('sales_rep_c', {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ]
    });
    
    if (!salesRepsResponse.success) {
      console.error('Failed to fetch sales reps:', salesRepsResponse.message);
      return [];
    }
    
    const salesReps = salesRepsResponse.data || [];
    
    // Get leads data for performance calculation
    const leadsResponse = await apperClient.fetchRecords('lead_c', {
      fields: [
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ]
    });
    
    const leads = leadsResponse.success ? leadsResponse.data : [];
    
    // Calculate performance for each sales rep
    const userStats = salesReps.map(rep => {
      const userLeads = leads.filter(lead => {
        const addedBy = lead.added_by_c?.Id || lead.added_by_c;
        return addedBy === rep.Id;
      });
      
      // Calculate leads for different periods
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const todayLeads = userLeads.filter(lead => {
        const leadDate = new Date(lead.created_at_c);
        return leadDate >= today;
      });
      
      const weekLeads = userLeads.filter(lead => {
        const leadDate = new Date(lead.created_at_c);
        return leadDate >= weekStart;
      });
      
      const monthLeads = userLeads.filter(lead => {
        const leadDate = new Date(lead.created_at_c);
        return leadDate >= monthStart;
      });
      
      return {
        Id: rep.Id,
        name: rep.Name,
        leadsContacted: rep.leads_contacted_c || 0,
        meetingsBooked: rep.meetings_booked_c || 0,
        dealsClosed: rep.deals_closed_c || 0,
        totalRevenue: rep.total_revenue_c || 0,
        totalLeads: userLeads.length,
        todayLeads: todayLeads.length,
        weekLeads: weekLeads.length,
        monthLeads: monthLeads.length,
        conversionRate: rep.meetings_booked_c > 0 ? 
          Math.round((rep.deals_closed_c / rep.meetings_booked_c) * 100) : 0
      };
    });
    
    return userStats.sort((a, b) => b.totalLeads - a.totalLeads);
  } catch (error) {
    console.error('Error fetching user performance:', error.message);
    return [];
  }
};