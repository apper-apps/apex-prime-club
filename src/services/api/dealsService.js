// Deals service using ApperClient for database operations
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

export const getDeals = async (year = null) => {
  await simulateAPICall(500);
  
  try {
    const apperClient = getApperClient();
    
    let filters = [];
    
    // Filter by year if specified
    if (year) {
      const yearStart = `${year}-01-01T00:00:00Z`;
      const yearEnd = `${year + 1}-01-01T00:00:00Z`;
      
      filters.push({
        FieldName: "created_at_c",
        Operator: "GreaterThanOrEqualTo",
        Values: [yearStart]
      });
      filters.push({
        FieldName: "created_at_c",
        Operator: "LessThan",
        Values: [yearEnd]
      });
    }
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "lead_name_c" } },
        { field: { Name: "lead_id_c" } },
        { field: { Name: "value_c" } },
        { field: { Name: "stage_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "start_month_c" } },
        { field: { Name: "end_month_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: filters.length > 0 ? filters : undefined,
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('deal_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch deals:', response.message);
      return [];
    }
    
    const deals = response.data || [];
    
    // Transform to match expected format
    return deals.map(deal => ({
      Id: deal.Id,
      name: deal.Name,
      leadName: deal.lead_name_c || '',
      leadId: deal.lead_id_c || '',
      value: deal.value_c || 0,
      stage: deal.stage_c || 'Connected',
      assignedRep: deal.assigned_rep_c || '',
      edition: deal.edition_c || 'Select Edition',
      startMonth: deal.start_month_c || 1,
      endMonth: deal.end_month_c || 3,
      createdAt: deal.created_at_c || new Date().toISOString(),
      year: year || new Date().getFullYear()
    }));
  } catch (error) {
    console.error('Error fetching deals:', error.message);
    return [];
  }
};

export const getDealById = async (id) => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "lead_name_c" } },
        { field: { Name: "lead_id_c" } },
        { field: { Name: "value_c" } },
        { field: { Name: "stage_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "start_month_c" } },
        { field: { Name: "end_month_c" } },
        { field: { Name: "created_at_c" } }
      ]
    };
    
    const response = await apperClient.getRecordById('deal_c', id, params);
    
    if (!response.success) {
      throw new Error("Deal not found");
    }
    
    const deal = response.data;
    
    // Transform to match expected format
    return {
      Id: deal.Id,
      name: deal.Name,
      leadName: deal.lead_name_c || '',
      leadId: deal.lead_id_c || '',
      value: deal.value_c || 0,
      stage: deal.stage_c || 'Connected',
      assignedRep: deal.assigned_rep_c || '',
      edition: deal.edition_c || 'Select Edition',
      startMonth: deal.start_month_c || 1,
      endMonth: deal.end_month_c || 3,
      createdAt: deal.created_at_c || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching deal by ID:', error.message);
    throw new Error("Deal not found");
  }
};

export const createDeal = async (dealData) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Prepare record data with only Updateable fields
    const recordData = {
      Name: dealData.name,
      lead_name_c: dealData.leadName,
      lead_id_c: dealData.leadId,
      value_c: dealData.value || 0,
      stage_c: dealData.stage || 'Connected',
      assigned_rep_c: dealData.assignedRep,
      edition_c: dealData.edition || 'Select Edition',
      start_month_c: dealData.startMonth || 1,
      end_month_c: dealData.endMonth || 3,
      created_at_c: new Date().toISOString()
    };
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.createRecord('deal_c', params);
    
    if (!response.success) {
      console.error('Failed to create deal:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const createdDeal = result.data;
        
        // Transform to match expected format
        return {
          Id: createdDeal.Id,
          name: createdDeal.Name,
          leadName: createdDeal.lead_name_c || dealData.leadName,
          leadId: createdDeal.lead_id_c || dealData.leadId,
          value: createdDeal.value_c || dealData.value,
          stage: createdDeal.stage_c || dealData.stage,
          assignedRep: createdDeal.assigned_rep_c || dealData.assignedRep,
          edition: createdDeal.edition_c || dealData.edition,
          startMonth: createdDeal.start_month_c || dealData.startMonth,
          endMonth: createdDeal.end_month_c || dealData.endMonth,
          createdAt: createdDeal.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to create deal');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error creating deal:', error.message);
    throw error;
  }
};

export const updateDeal = async (id, updates) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Transform updates to database field names (only Updateable fields)
    const recordData = {
      Id: id
    };
    
    if (updates.name !== undefined) recordData.Name = updates.name;
    if (updates.leadName !== undefined) recordData.lead_name_c = updates.leadName;
    if (updates.leadId !== undefined) recordData.lead_id_c = updates.leadId;
    if (updates.value !== undefined) recordData.value_c = updates.value;
    if (updates.stage !== undefined) recordData.stage_c = updates.stage;
    if (updates.assignedRep !== undefined) recordData.assigned_rep_c = updates.assignedRep;
    if (updates.edition !== undefined) recordData.edition_c = updates.edition;
    if (updates.startMonth !== undefined) recordData.start_month_c = updates.startMonth;
    if (updates.endMonth !== undefined) recordData.end_month_c = updates.endMonth;
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.updateRecord('deal_c', params);
    
    if (!response.success) {
      console.error('Failed to update deal:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const updatedDeal = result.data;
        
        // Transform to match expected format
        return {
          Id: updatedDeal.Id,
          name: updatedDeal.Name,
          leadName: updatedDeal.lead_name_c || '',
          leadId: updatedDeal.lead_id_c || '',
          value: updatedDeal.value_c || 0,
          stage: updatedDeal.stage_c || 'Connected',
          assignedRep: updatedDeal.assigned_rep_c || '',
          edition: updatedDeal.edition_c || 'Select Edition',
          startMonth: updatedDeal.start_month_c || 1,
          endMonth: updatedDeal.end_month_c || 3,
          createdAt: updatedDeal.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to update deal');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error updating deal:', error.message);
    throw error;
  }
};

export const deleteDeal = async (id) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('deal_c', params);
    
    if (!response.success) {
      console.error('Failed to delete deal:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete deal');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting deal:', error.message);
    throw error;
  }
};