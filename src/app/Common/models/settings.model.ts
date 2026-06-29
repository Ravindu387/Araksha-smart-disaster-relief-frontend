export interface Settings {

  id: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  jobTitle: string;

  location: string;

  bio: string;

  timezone: string;

  language: string;

  twoFactorEnabled: boolean;

  sessionTimeout: string;

  passwordExpiry: string;

  autoAssignVolunteers: boolean;

  aiRecommendations: boolean;

  gpsTracking: boolean;

  publicAlerts: boolean;

}