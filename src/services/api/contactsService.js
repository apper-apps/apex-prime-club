// Contacts service using ApperClient for database operations
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

export const getContacts = async () => {
  await simulateAPICall(400);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "company_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } }
      ],
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('contact_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch contacts:', response.message);
      return [];
    }
    
    const contacts = response.data || [];
    
    // Transform to match expected format
    return contacts.map(contact => ({
      Id: contact.Id,
      name: contact.Name,
      email: contact.email_c || '',
      company: contact.company_c || '',
      assignedRep: contact.assigned_rep_c || '',
      status: contact.status_c || 'New',
      createdAt: contact.created_at_c || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching contacts:', error.message);
    return [];
  }
};

export const getContactById = async (id) => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "company_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } }
      ]
    };
    
    const response = await apperClient.getRecordById('contact_c', id, params);
    
    if (!response.success) {
      throw new Error("Contact not found");
    }
    
    const contact = response.data;
    
    // Transform to match expected format
    return {
      Id: contact.Id,
      name: contact.Name,
      email: contact.email_c || '',
      company: contact.company_c || '',
      assignedRep: contact.assigned_rep_c || '',
      status: contact.status_c || 'New',
      createdAt: contact.created_at_c || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching contact by ID:', error.message);
    throw new Error("Contact not found");
  }
};

export const createContact = async (contactData) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Prepare record data with only Updateable fields
    const recordData = {
      Name: contactData.name,
      email_c: contactData.email,
      company_c: contactData.company,
      assigned_rep_c: contactData.assignedRep,
      status_c: contactData.status || 'New',
      created_at_c: new Date().toISOString()
    };
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.createRecord('contact_c', params);
    
    if (!response.success) {
      console.error('Failed to create contact:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const createdContact = result.data;
        
        // Transform to match expected format
        return {
          Id: createdContact.Id,
          name: createdContact.Name,
          email: createdContact.email_c || contactData.email,
          company: createdContact.company_c || contactData.company,
          assignedRep: createdContact.assigned_rep_c || contactData.assignedRep,
          status: createdContact.status_c || contactData.status,
          createdAt: createdContact.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to create contact');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error creating contact:', error.message);
    throw error;
  }
};

export const updateContact = async (id, updates) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Transform updates to database field names (only Updateable fields)
    const recordData = {
      Id: id
    };
    
    if (updates.name !== undefined) recordData.Name = updates.name;
    if (updates.email !== undefined) recordData.email_c = updates.email;
    if (updates.company !== undefined) recordData.company_c = updates.company;
    if (updates.assignedRep !== undefined) recordData.assigned_rep_c = updates.assignedRep;
    if (updates.status !== undefined) recordData.status_c = updates.status;
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.updateRecord('contact_c', params);
    
    if (!response.success) {
      console.error('Failed to update contact:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const updatedContact = result.data;
        
        // Transform to match expected format
        return {
          Id: updatedContact.Id,
          name: updatedContact.Name,
          email: updatedContact.email_c || '',
          company: updatedContact.company_c || '',
          assignedRep: updatedContact.assigned_rep_c || '',
          status: updatedContact.status_c || 'New',
          createdAt: updatedContact.created_at_c || new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Failed to update contact');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error updating contact:', error.message);
    throw error;
  }
};

export const deleteContact = async (id) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('contact_c', params);
    
    if (!response.success) {
      console.error('Failed to delete contact:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete contact');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error.message);
    throw error;
  }
};