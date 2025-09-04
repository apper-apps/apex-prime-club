// Sales Rep service using ApperClient for database operations
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

export const getSalesReps = async () => {
  await simulateAPICall();
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ],
      orderBy: [
        { fieldName: "Name", sorttype: "ASC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('sales_rep_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch sales reps:', response.message);
      return [];
    }
    
    const salesReps = response.data || [];
    
    // Transform to match expected format
    return salesReps.map(rep => ({
      Id: rep.Id,
      name: rep.Name,
      leadsContacted: rep.leads_contacted_c || 0,
      meetingsBooked: rep.meetings_booked_c || 0,
      dealsClosed: rep.deals_closed_c || 0,
      totalRevenue: rep.total_revenue_c || 0
    }));
  } catch (error) {
    console.error('Error fetching sales reps:', error.message);
    return [];
  }
};

export const getSalesRepById = async (id) => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ]
    };
    
    const response = await apperClient.getRecordById('sales_rep_c', id, params);
    
    if (!response.success) {
      throw new Error("Sales rep not found");
    }
    
    const rep = response.data;
    
    // Transform to match expected format
    return {
      Id: rep.Id,
      name: rep.Name,
      leadsContacted: rep.leads_contacted_c || 0,
      meetingsBooked: rep.meetings_booked_c || 0,
      dealsClosed: rep.deals_closed_c || 0,
      totalRevenue: rep.total_revenue_c || 0
    };
  } catch (error) {
    console.error('Error fetching sales rep by ID:', error.message);
    throw new Error("Sales rep not found");
  }
};

export const createSalesRep = async (repData) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Prepare record data with only Updateable fields
    const recordData = {
      Name: repData.name,
      leads_contacted_c: repData.leadsContacted || 0,
      meetings_booked_c: repData.meetingsBooked || 0,
      deals_closed_c: repData.dealsClosed || 0,
      total_revenue_c: repData.totalRevenue || 0
    };
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.createRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error('Failed to create sales rep:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const createdRep = result.data;
        
        // Transform to match expected format
        return {
          Id: createdRep.Id,
          name: createdRep.Name,
          leadsContacted: createdRep.leads_contacted_c || 0,
          meetingsBooked: createdRep.meetings_booked_c || 0,
          dealsClosed: createdRep.deals_closed_c || 0,
          totalRevenue: createdRep.total_revenue_c || 0
        };
      } else {
        throw new Error(result.message || 'Failed to create sales rep');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error creating sales rep:', error.message);
    throw error;
  }
};

export const updateSalesRep = async (id, updates) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Transform updates to database field names (only Updateable fields)
    const recordData = {
      Id: id
    };
    
    if (updates.name !== undefined) recordData.Name = updates.name;
    if (updates.leadsContacted !== undefined) recordData.leads_contacted_c = updates.leadsContacted;
    if (updates.meetingsBooked !== undefined) recordData.meetings_booked_c = updates.meetingsBooked;
    if (updates.dealsClosed !== undefined) recordData.deals_closed_c = updates.dealsClosed;
    if (updates.totalRevenue !== undefined) recordData.total_revenue_c = updates.totalRevenue;
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.updateRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error('Failed to update sales rep:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const updatedRep = result.data;
        
        // Transform to match expected format
        return {
          Id: updatedRep.Id,
          name: updatedRep.Name,
          leadsContacted: updatedRep.leads_contacted_c || 0,
          meetingsBooked: updatedRep.meetings_booked_c || 0,
          dealsClosed: updatedRep.deals_closed_c || 0,
          totalRevenue: updatedRep.total_revenue_c || 0
        };
      } else {
        throw new Error(result.message || 'Failed to update sales rep');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error updating sales rep:', error.message);
    throw error;
  }
};

export const deleteSalesRep = async (id) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error('Failed to delete sales rep:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete sales rep');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting sales rep:', error.message);
    throw error;
  }
};