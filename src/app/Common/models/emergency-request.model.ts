export interface EmergencyRequest {

  id: number;

  requestId: string;

  citizenName: string;

  emergencyType: string;

  priority: 'Critical' | 'High' | 'Medium' | 'Low';

  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';

  location: string;

  assignedVolunteer: string;

  requestTime: string;

}