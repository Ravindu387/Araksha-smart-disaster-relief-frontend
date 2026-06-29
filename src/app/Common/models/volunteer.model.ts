export interface Volunteer {

  id: number;

  name: string;

  location: string;

  skills: string[];

  status: 'Available' | 'On Duty' | 'Off Duty';

  rating: number;

  tasks: number;

  phone: string;

  // UI only
  displayId?: string;

  initials: string;

  avatarColor: string;

}