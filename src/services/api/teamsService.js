// Team Members service using ApperClient for database operations
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

export const getTeamMembers = async () => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "role_c" } },
        { field: { Name: "permissions_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } },
        { field: { Name: "updated_at_c" } },
        { field: { Name: "last_login_c" } }
      ],
      orderBy: [
        { fieldName: "created_at_c", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('team_member_c', params);
    
    if (!response.success) {
      console.error('Failed to fetch team members:', response.message);
      return [];
    }
    
    const teamMembers = response.data || [];
    
    // Transform to match expected format
    return teamMembers.map(member => ({
      Id: member.Id,
      name: member.Name,
      email: member.email_c || '',
      role: member.role_c || 'viewer',
      permissions: member.permissions_c ? JSON.parse(member.permissions_c) : {
        dashboard: true,
        leads: false,
        hotlist: false,
        pipeline: false,
        calendar: false,
        analytics: false,
        leaderboard: false,
        contacts: false
      },
      status: member.status_c || 'pending',
      createdAt: member.created_at_c || new Date().toISOString(),
      updatedAt: member.updated_at_c || new Date().toISOString(),
      lastLogin: member.last_login_c || null
    }));
  } catch (error) {
    console.error('Error fetching team members:', error.message);
    return [];
  }
};
export const getTeamMemberById = async (id) => {
  await simulateAPICall(200);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "role_c" } },
        { field: { Name: "permissions_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } },
        { field: { Name: "updated_at_c" } },
        { field: { Name: "last_login_c" } }
      ]
    };
    
    const response = await apperClient.getRecordById('team_member_c', id, params);
    
    if (!response.success) {
      throw new Error("Team member not found");
    }
    
    const member = response.data;
    
    // Transform to match expected format
    return {
      Id: member.Id,
      name: member.Name,
      email: member.email_c || '',
      role: member.role_c || 'viewer',
      permissions: member.permissions_c ? JSON.parse(member.permissions_c) : {
        dashboard: true,
        leads: false,
        hotlist: false,
        pipeline: false,
        calendar: false,
        analytics: false,
        leaderboard: false,
        contacts: false
      },
      status: member.status_c || 'pending',
      createdAt: member.created_at_c || new Date().toISOString(),
      updatedAt: member.updated_at_c || new Date().toISOString(),
      lastLogin: member.last_login_c || null
    };
  } catch (error) {
    console.error('Error fetching team member by ID:', error.message);
    throw new Error("Team member not found");
  }
};
export const inviteTeamMember = async (memberData) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // Validate required fields
    if (!memberData.name || !memberData.name.trim()) {
      throw new Error("Member name is required");
    }
    
    if (!memberData.email || !memberData.email.trim()) {
      throw new Error("Member email is required");
    }
    
    // Check if email already exists
    const existingResponse = await apperClient.fetchRecords('team_member_c', {
      fields: [{ field: { Name: "email_c" } }],
      where: [{
        FieldName: "email_c",
        Operator: "EqualTo",
        Values: [memberData.email.toLowerCase()]
      }]
    });
    
    if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
      throw new Error("A team member with this email already exists");
    }
    
    // Prepare record data with only Updateable fields
    const recordData = {
      Name: memberData.name.trim(),
      email_c: memberData.email.trim().toLowerCase(),
      role_c: memberData.role || "viewer",
      permissions_c: JSON.stringify(memberData.permissions || {
        dashboard: true,
        leads: false,
        hotlist: false,
        pipeline: false,
        calendar: false,
        analytics: false,
        leaderboard: false,
        contacts: false
      }),
      status_c: "pending",
      created_at_c: new Date().toISOString(),
      updated_at_c: new Date().toISOString(),
      last_login_c: null
    };
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.createRecord('team_member_c', params);
    
    if (!response.success) {
      console.error('Failed to invite team member:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const createdMember = result.data;
        
        // Transform to match expected format
        return {
          Id: createdMember.Id,
          name: createdMember.Name,
          email: createdMember.email_c || memberData.email,
          role: createdMember.role_c || memberData.role,
          permissions: createdMember.permissions_c ? JSON.parse(createdMember.permissions_c) : memberData.permissions,
          status: createdMember.status_c || 'pending',
          createdAt: createdMember.created_at_c || new Date().toISOString(),
          updatedAt: createdMember.updated_at_c || new Date().toISOString(),
          lastLogin: createdMember.last_login_c || null
        };
      } else {
        throw new Error(result.message || 'Failed to invite team member');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error inviting team member:', error.message);
    throw error;
  }
};
export const updateTeamMember = async (id, updates) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    // If email is being updated, check for duplicates
    if (updates.email) {
      const existingResponse = await apperClient.fetchRecords('team_member_c', {
        fields: [{ field: { Name: "email_c" } }],
        where: [
          {
            FieldName: "email_c",
            Operator: "EqualTo",
            Values: [updates.email.toLowerCase()]
          },
          {
            FieldName: "Id",
            Operator: "NotEqualTo",
            Values: [id]
          }
        ]
      });
      
      if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
        throw new Error("A team member with this email already exists");
      }
    }
    
    // Transform updates to database field names (only Updateable fields)
    const recordData = {
      Id: id,
      updated_at_c: new Date().toISOString()
    };
    
    if (updates.name !== undefined) recordData.Name = updates.name;
    if (updates.email !== undefined) recordData.email_c = updates.email.toLowerCase();
    if (updates.role !== undefined) recordData.role_c = updates.role;
    if (updates.permissions !== undefined) recordData.permissions_c = JSON.stringify(updates.permissions);
    if (updates.status !== undefined) recordData.status_c = updates.status;
    if (updates.lastLogin !== undefined) recordData.last_login_c = updates.lastLogin;
    
    const params = {
      records: [recordData]
    };
    
    const response = await apperClient.updateRecord('team_member_c', params);
    
    if (!response.success) {
      console.error('Failed to update team member:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        const updatedMember = result.data;
        
        // Transform to match expected format
        return {
          Id: updatedMember.Id,
          name: updatedMember.Name,
          email: updatedMember.email_c || '',
          role: updatedMember.role_c || 'viewer',
          permissions: updatedMember.permissions_c ? JSON.parse(updatedMember.permissions_c) : {},
          status: updatedMember.status_c || 'pending',
          createdAt: updatedMember.created_at_c || new Date().toISOString(),
          updatedAt: updatedMember.updated_at_c || new Date().toISOString(),
          lastLogin: updatedMember.last_login_c || null
        };
      } else {
        throw new Error(result.message || 'Failed to update team member');
      }
    }
    
    throw new Error('No response data received');
  } catch (error) {
    console.error('Error updating team member:', error.message);
    throw error;
  }
};
export const removeTeamMember = async (id) => {
  await simulateAPICall(300);
  
  try {
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('team_member_c', params);
    
    if (!response.success) {
      console.error('Failed to remove team member:', response.message);
      throw new Error(response.message);
    }
    
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to remove team member');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error.message);
    throw error;
  }
};
export const getTeamMemberPerformance = async (id) => {
  await simulateAPICall(250);
  
  try {
    const apperClient = getApperClient();
    
    // Check if team member exists
    const memberResponse = await apperClient.getRecordById('team_member_c', id, {
      fields: [{ field: { Name: "Name" } }]
    });
    
    if (!memberResponse.success) {
      throw new Error("Team member not found");
    }
    
    // Generate mock performance data since we don't have detailed performance tracking yet
    // In a real implementation, this would query leads, deals, and meetings tables
    const mockPerformance = {
      totalLeads: Math.floor(Math.random() * 50) + 20,
      totalDeals: Math.floor(Math.random() * 10) + 5,
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      totalMeetings: Math.floor(Math.random() * 20) + 10,
      conversionRate: Math.floor(Math.random() * 15) + 5,
      avgDealSize: 0
    };
    
    mockPerformance.avgDealSize = mockPerformance.totalDeals > 0 ? 
      Math.round(mockPerformance.totalRevenue / mockPerformance.totalDeals) : 0;
    
    return mockPerformance;
  } catch (error) {
    console.error('Error fetching team member performance:', error.message);
    throw error;
  }
};
export const activateTeamMember = async (id) => {
  await simulateAPICall(200);
  
  try {
    const result = await updateTeamMember(id, { 
      status: "active",
      lastLogin: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error('Error activating team member:', error.message);
    throw error;
  }
};

export const deactivateTeamMember = async (id) => {
  await simulateAPICall(200);
  
  try {
    const result = await updateTeamMember(id, { status: "inactive" });
    return result;
  } catch (error) {
    console.error('Error deactivating team member:', error.message);
    throw error;
  }
};