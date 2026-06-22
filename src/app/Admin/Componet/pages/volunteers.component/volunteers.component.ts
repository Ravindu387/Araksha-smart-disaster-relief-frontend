import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Volunteer {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  location: string;
  phone?: string;
  skills: string[];
  status: 'On Duty' | 'Available' | 'Off Duty';
  rating: number;
  tasks: number;
}

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteers.component.html'
})
export class VolunteersComponent {
  // View Toggle State: 'grid' or 'list'
  viewMode: 'grid' | 'list' = 'grid';
  
  // Filter and Search States
  searchQuery: string = '';
  statusFilter: 'All' | 'Available' | 'On Duty' | 'Off Duty' = 'All';

  // Mock Data from your screenshots
  volunteers: Volunteer[] = [
    { id: 'V-1024', name: 'James Wright', initials: 'JW', avatarBg: 'bg-blue-600', location: 'Houston, TX', phone: '+1 (713) 555-0192', skills: ['First Aid', 'Water Rescue'], status: 'On Duty', rating: 4.9, tasks: 142 },
    { id: 'V-1023', name: 'Lisa Chen', initials: 'LC', avatarBg: 'bg-purple-600', location: 'Los Angeles, CA', phone: '+1 (213) 555-0847', skills: ['Medical', 'Logistics'], status: 'Available', rating: 4.8, tasks: 98 },
    { id: 'V-1022', name: 'Michael Davis', initials: 'MD', avatarBg: 'bg-emerald-600', location: 'Chicago, IL', phone: '+1 (312) 555-0334', skills: ['Search & Rescue', 'Firefighting'], status: 'Available', rating: 4.7, tasks: 210 },
    { id: 'V-1021', name: 'Anna Rodriguez', initials: 'AR', avatarBg: 'bg-rose-600', location: 'Miami, FL', phone: '+1 (305) 555-0712', skills: ['First Aid', 'Communications'], status: 'On Duty', rating: 4.9, tasks: 185 },
    { id: 'V-1020', name: 'Tom Harris', initials: 'TH', avatarBg: 'bg-orange-600', location: 'Oklahoma City, OK', phone: '+1 (405) 555-1234', skills: ['Construction', 'Logistics'], status: 'Off Duty', rating: 4.6, tasks: 67 }
  ];

  // Quick Stats Computations
  get totalRegistered() { return this.volunteers.length; }
  get countOnDuty() { return this.volunteers.filter(v => v.status === 'On Duty').length; }
  get countAvailable() { return this.volunteers.filter(v => v.status === 'Available').length; }
  get countOffDuty() { return this.volunteers.filter(v => v.status === 'Off Duty').length; }

  // Filtered computed list
  get filteredVolunteers() {
    return this.volunteers.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            v.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            v.skills.some(s => s.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchesStatus = this.statusFilter === 'All' || v.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  setStatusFilter(status: 'All' | 'Available' | 'On Duty' | 'Off Duty') {
    this.statusFilter = status;
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }
}