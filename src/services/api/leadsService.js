// Leads service using ApperClient for database operations
// Leads service using ApperClient for database operations
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

// Utility function to normalize website URLs
const normalizeUrl = (url) => {
  if (!url) return '';
  return url.toLowerCase().replace(/\/$/, '');
};

export const getLeads = async () => {
  await simulateAPICall(400);
  
  try {
    const apperClient = getApperClient();
    
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
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch leads:', response.message);
      return { leads: [], deduplicationResult: null };
    }
    
    const leads = response.data || [];
    
    // Transform to match expected format
    const transformedLeads = leads.map(lead => ({
      Id: lead.Id,
      websiteUrl: lead.website_url_c || '',
      teamSize: lead.team_size_c || '1-3',
      arr: lead.arr_c || 0,
      category: lead.category_c || '',
      linkedinUrl: lead.linkedin_url_c || '',
      status: lead.status_c || 'Keep an Eye',
      fundingType: lead.funding_type_c || 'Bootstrapped',
      edition: lead.edition_c || 'Select Edition',
      followUpDate: lead.follow_up_date_c || null,
      addedBy: lead.added_by_c?.Id || lead.added_by_c,
      addedByName: lead.added_by_c?.Name || 'Unknown',
      createdAt: lead.created_at_c || new Date().toISOString()
    }));
    
    return {
      leads: transformedLeads,
      deduplicationResult: null
    };
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    return { leads: [], deduplicationResult: null };
  }
};
export const getLeadById = async (id) => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
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
      ]
    };
    
    const response = await apperClient.getRecordById('lead_c', id, params);
    
    if (!response.success) {
      throw new Error("Lead not found");
    }
    
    const lead = response.data;
    
    // Transform to match expected format
    return {
      Id: lead.Id,
      websiteUrl: lead.website_url_c || '',
      teamSize: lead.team_size_c || '1-3',
      arr: lead.arr_c || 0,
      category: lead.category_c || '',
      linkedinUrl: lead.linkedin_url_c || '',
      status: lead.status_c || 'Keep an Eye',
      fundingType: lead.funding_type_c || 'Bootstrapped',
      edition: lead.edition_c || 'Select Edition',
      followUpDate: lead.follow_up_date_c || null,
      addedBy: lead.added_by_c?.Id || lead.added_by_c,
      addedByName: lead.added_by_c?.Name || 'Unknown',
      createdAt: lead.created_at_c || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching lead by ID:', error.message);
    throw new Error("Lead not found");
  }
};

export const createLead = async (leadData) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Validate required fields
    if (!leadData.websiteUrl || !leadData.websiteUrl.trim()) {
      throw new Error("Website URL is required");
    }
    
    // Check for duplicate website URL before creating
    const normalizedUrl = normalizeUrl(leadData.websiteUrl);
    const existingResponse = await apperClient.fetchRecords('lead_c', {
      fields: [{ field: { Name: "website_url_c" } }],
      where: [{
        FieldName: "website_url_c",
        Operator: "EqualTo",
        Values: [leadData.websiteUrl]
      }]
    });
    
    if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
      throw new Error(`A lead with website URL "${leadData.websiteUrl}" already exists`);
    }
    
    // Prepare record data with only Updateable fields
    const recordData = {
      Name: leadData.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      website_url_c: leadData.websiteUrl,
      team_size_c: leadData.teamSize || "1-3",
      arr_c: leadData.arr || 0,
      category_c: leadData.category || "Other",
      linkedin_url_c: leadData.linkedinUrl || "",
      status_c: leadData.status || "Keep an Eye",
      funding_type_c: leadData.fundingType || "Bootstrapped",
      edition_c: leadData.edition || "Select Edition",
      follow_up_date_c: leadData.followUpDate || null,
      added_by_c: leadData.addedBy || null,
      created_at_c: new Date().toISOString()
    };
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.createRecord('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to create lead:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const createdLead = result.data;
        
        // Transform to match expected format
        return {
          Id: createdLead.Id,
          websiteUrl: createdLead.website_url_c || leadData.websiteUrl,
          teamSize: createdLead.team_size_c || leadData.teamSize,
          arr: createdLead.arr_c || leadData.arr,
          category: createdLead.category_c || leadData.category,
          linkedinUrl: createdLead.linkedin_url_c || leadData.linkedinUrl,
          status: createdLead.status_c || leadData.status,
          fundingType: createdLead.funding_type_c || leadData.fundingType,
          edition: createdLead.edition_c || leadData.edition,
          followUpDate: createdLead.follow_up_date_c || leadData.followUpDate,
          addedBy: createdLead.added_by_c?.Id || createdLead.added_by_c,
          addedByName: createdLead.added_by_c?.Name || 'Unknown',
          createdAt: createdLead.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to create lead');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error creating lead:', error.message);
    throw error;
  }
};

export const updateLead = async (id, updates) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Transform updates to database field names (only Updateable fields)
    const recordData = {
      Id: id
    };
    
    if (updates.websiteUrl !== undefined) recordData.website_url_c = updates.websiteUrl;
    if (updates.teamSize !== undefined) recordData.team_size_c = updates.teamSize;
    if (updates.arr !== undefined) recordData.arr_c = updates.arr;
    if (updates.category !== undefined) recordData.category_c = updates.category;
    if (updates.linkedinUrl !== undefined) recordData.linkedin_url_c = updates.linkedinUrl;
    if (updates.status !== undefined) recordData.status_c = updates.status;
    if (updates.fundingType !== undefined) recordData.funding_type_c = updates.fundingType;
    if (updates.edition !== undefined) recordData.edition_c = updates.edition;
    if (updates.followUpDate !== undefined) recordData.follow_up_date_c = updates.followUpDate;
    if (updates.addedBy !== undefined) recordData.added_by_c = updates.addedBy;
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.updateRecord('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to update lead:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const updatedLead = result.data;
        
        // Transform to match expected format
        return {
          Id: updatedLead.Id,
          websiteUrl: updatedLead.website_url_c || '',
          teamSize: updatedLead.team_size_c || '1-3',
          arr: updatedLead.arr_c || 0,
          category: updatedLead.category_c || '',
          linkedinUrl: updatedLead.linkedin_url_c || '',
          status: updatedLead.status_c || 'Keep an Eye',
          fundingType: updatedLead.funding_type_c || 'Bootstrapped',
          edition: updatedLead.edition_c || 'Select Edition',
          followUpDate: updatedLead.follow_up_date_c || null,
          addedBy: updatedLead.added_by_c?.Id || updatedLead.added_by_c,
          addedByName: updatedLead.added_by_c?.Name || 'Unknown',
          createdAt: updatedLead.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to update lead');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error updating lead:', error.message);
    throw error;
  }
};

export const deleteLead = async (id) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('lead_c', params);
    
    if (!response.success) {
      console.error('Failed to delete lead:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete lead');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting lead:', error.message);
    throw error;
  }
};

export const getDailyLeadsReport = async () => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's leads
    const leadsResponse = await apperClient.fetchRecords('lead_c', {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: [
        {
          FieldName: "created_at_c",
          Operator: "GreaterThanOrEqualTo",
          Values: [today + "T00:00:00Z"]
        },
        {
          FieldName: "created_at_c",
          Operator: "LessThan",
          Values: [tomorrow.toISOString().split('T')[0] + "T00:00:00Z"]
        }
      ]
    });
    
    // Get sales reps
    const salesRepsResponse = await apperClient.fetchRecords('sales_rep_c', {
      fields: [
        { field: { Name: "Name" } }
      ]
    });
    
    const todaysLeads = leadsResponse.success ? leadsResponse.data : [];
    const salesReps = salesRepsResponse.success ? salesRepsResponse.data : [];
    
    // Group by sales rep
    const reportData = {};
    
    // Initialize all sales reps with empty data
    salesReps.forEach(rep => {
      reportData[rep.Name] = {
        salesRep: rep.Name,
        salesRepId: rep.Id,
        leads: [],
        leadCount: 0,
        lowPerformance: false
      };
    });
    
    // Add today's leads to the respective sales reps
    todaysLeads.forEach(lead => {
      const repName = lead.added_by_c?.Name || 'Unknown';
      
      if (reportData[repName]) {
        reportData[repName].leads.push({
          Id: lead.Id,
          websiteUrl: lead.website_url_c,
          createdAt: lead.created_at_c
        });
      } else if (repName === 'Unknown') {
        // Handle unknown reps
        if (!reportData['Unknown']) {
          reportData['Unknown'] = {
            salesRep: 'Unknown',
            salesRepId: null,
            leads: [],
            leadCount: 0,
            lowPerformance: false
          };
        }
        reportData['Unknown'].leads.push({
          Id: lead.Id,
          websiteUrl: lead.website_url_c,
          createdAt: lead.created_at_c
        });
      }
    });
    
    // Calculate lead counts and identify low performers
    Object.values(reportData).forEach(repData => {
      repData.leadCount = repData.leads.length;
      repData.lowPerformance = repData.leadCount < 5;
    });
    
    // Convert to array and sort by lead count (descending)
    return Object.values(reportData).sort((a, b) => b.leads.length - a.leads.length);
  } catch (error) {
    console.error('Error fetching daily leads report:', error.message);
    return [];
  }
};

export const getPendingFollowUps = async () => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Get current date and 7 days from now
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const response = await apperClient.fetchRecords('lead_c', {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "follow_up_date_c" } },
        { field: { Name: "added_by_c" } }
      ],
      where: [
        {
          FieldName: "follow_up_date_c",
          Operator: "GreaterThanOrEqualTo",
          Values: [now.toISOString()]
        },
        {
          FieldName: "follow_up_date_c",
          Operator: "LessThanOrEqualTo",
          Values: [sevenDaysFromNow.toISOString()]
        }
      ],
      orderBy: [
        { fieldName: "follow_up_date_c", sorttype: "ASC" }
      ]
    });
    
    if (!response.success) {
      console.error('Failed to fetch pending follow-ups:', response.message);
      return [];
    }
    
    const leads = response.data || [];
    
    // Transform to match expected format
    return leads.map(lead => ({
      Id: lead.Id,
      websiteUrl: lead.website_url_c || '',
      category: lead.category_c || '',
      followUpDate: lead.follow_up_date_c,
      addedBy: lead.added_by_c?.Id || lead.added_by_c,
      addedByName: lead.added_by_c?.Name || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error.message);
    return [];
  }
};

// Get only fresh leads that have never existed in the system before
export const getFreshLeadsOnly = async (leadsArray) => {
  await simulateAPICall(100);
  
  try {
    const apperClient = getApperClient();
    const today = new Date();
    
    // Filter to only today's leads
    const todaysLeads = leadsArray.filter(lead => {
      const leadDate = new Date(lead.createdAt || lead.created_at_c);
      return leadDate.toDateString() === today.toDateString();
    });
    
    // For each today's lead, check if URL existed before
    const freshLeads = [];
    
    for (const lead of todaysLeads) {
      const normalizedUrl = normalizeUrl(lead.websiteUrl || lead.website_url_c);
      
      // Check if this URL existed before today
      const existingResponse = await apperClient.fetchRecords('lead_c', {
        fields: [{ field: { Name: "created_at_c" } }],
        where: [
          {
            FieldName: "website_url_c",
            Operator: "EqualTo",
            Values: [lead.websiteUrl || lead.website_url_c]
          },
          {
            FieldName: "created_at_c",
            Operator: "LessThan",
            Values: [today.toISOString().split('T')[0] + "T00:00:00Z"]
          }
        ]
      });
      
      // If no previous records found, it's a fresh lead
      if (!existingResponse.success || !existingResponse.data || existingResponse.data.length === 0) {
        freshLeads.push(lead);
      }
    }
    
    return freshLeads;
  } catch (error) {
    console.error('Error filtering fresh leads:', error.message);
    return leadsArray.filter(lead => {
      const leadDate = new Date(lead.createdAt || lead.created_at_c);
      return leadDate.toDateString() === new Date().toDateString();
    });
  }
};