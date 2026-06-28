import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Volunteer {
  id: string;
  name: string;
  location: string;
  skills: string[];
  status: 'Available' | 'On Duty' | 'Off Duty';
  rating: number;
  tasks: number;
  phone: string;
  initials: string;
  avatarColor: string;
}

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteers.component.html'
})
export class VolunteersComponent {
  searchQuery = '';
  statusFilter: 'All' | 'Available' | 'On Duty' | 'Off Duty' = 'All';
  viewMode: 'list' | 'grid' = 'list';

  // Modal invite state
  inviteModalOpen = signal(false);
  newVolunteerName = '';
  newVolunteerLocation = '';
  newVolunteerPhone = '';
  newVolunteerSkills = '';

  volunteers: Volunteer[] = [
    {
      id: 'V-1024',
      name: 'James Wright',
      location: 'Houston, TX',
      skills: ['First Aid', 'Water Rescue'],
      status: 'On Duty',
      rating: 4.9,
      tasks: 142,
      phone: '+1 (713) 555-0192',
      initials: 'JW',
      avatarColor: 'bg-blue-600'
    },
    {
      id: 'V-1023',
      name: 'Lisa Chen',
      location: 'Los Angeles, CA',
      skills: ['Medical', 'Logistics'],
      status: 'Available',
      rating: 4.8,
      tasks: 98,
      phone: '+1 (213) 555-0847',
      initials: 'LC',
      avatarColor: 'bg-purple-600'
    },
    {
      id: 'V-1022',
      name: 'Michael Davis',
      location: 'Chicago, IL',
      skills: ['Search & Rescue', 'Firefighting'],
      status: 'Available',
      rating: 4.7,
      tasks: 210,
      phone: '+1 (312) 555-0334',
      initials: 'MD',
      avatarColor: 'bg-emerald-600'
    },
    {
      id: 'V-1021',
      name: 'Anna Rodriguez',
      location: 'Miami, FL',
      skills: ['First Aid', 'Communications'],
      status: 'On Duty',
      rating: 4.9,
      tasks: 185,
      phone: '+1 (305) 555-0712',
      initials: 'AR',
      avatarColor: 'bg-rose-600'
    },
    {
      id: 'V-1020',
      name: 'Tom Harris',
      location: 'Oklahoma City, OK',
      skills: ['Construction', 'Logistics'],
      status: 'Off Duty',
      rating: 4.6,
      tasks: 67,
      phone: '+1 (405) 555-0298',
      initials: 'TH',
      avatarColor: 'bg-amber-600'
    },
    {
      id: 'V-1019',
      name: 'Sarah Connor',
      location: 'Portland, OR',
      skills: ['Medical', 'First Aid'],
      status: 'Available',
      rating: 5,
      tasks: 321,
      phone: '+1 (503) 555-0876',
      initials: 'SC',
      avatarColor: 'bg-teal-600'
    },
    {
      id: 'V-1018',
      name: 'Kevin Park',
      location: 'Seattle, WA',
      skills: ['Water Rescue', 'Communications'],
      status: 'On Duty',
      rating: 4.7,
      tasks: 156,
      phone: '+1 (425) 555-0443',
      initials: 'KP',
      avatarColor: 'bg-indigo-600'
    },
    {
      id: 'V-1017',
      name: 'Diana Foster',
      location: 'Denver, CO',
      skills: ['Logistics', 'Construction'],
      status: 'Available',
      rating: 4.8,
      tasks: 89,
      phone: '+1 (720) 555-0119',
      initials: 'DF',
      avatarColor: 'bg-pink-600'
    }
  ];

  get totalCount(): number {
    return this.volunteers.length;
  }

  get availableCount(): number {
    return this.volunteers.filter(v => v.status === 'Available').length;
  }

  get onDutyCount(): number {
    return this.volunteers.filter(v => v.status === 'On Duty').length;
  }

  get offDutyCount(): number {
    return this.volunteers.filter(v => v.status === 'Off Duty').length;
  }

  get filteredVolunteers(): Volunteer[] {
    return this.volunteers.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.skills.some(s => s.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesStatus = this.statusFilter === 'All' || v.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  setStatusFilter(filter: 'All' | 'Available' | 'On Duty' | 'Off Duty'): void {
    this.statusFilter = filter;
  }

  openInviteModal(): void {
    this.inviteModalOpen.set(true);
  }

  closeInviteModal(): void {
    this.inviteModalOpen.set(false);
    this.newVolunteerName = '';
    this.newVolunteerLocation = '';
    this.newVolunteerPhone = '';
    this.newVolunteerSkills = '';
  }

  inviteVolunteerSubmit(): void {
    const name = this.newVolunteerName.trim();
    if (!name) return;

    const nextIdVal = 1017 - this.volunteers.length;
    const skillsList = this.newVolunteerSkills.split(',').map(s => s.trim()).filter(Boolean);
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600'];
    const randomColor = colors[this.volunteers.length % colors.length];

    this.volunteers.unshift({
      id: `V-${nextIdVal > 0 ? nextIdVal : 1000 + Math.floor(Math.random() * 500)}`,
      name,
      location: this.newVolunteerLocation.trim() || 'Houston, TX',
      skills: skillsList.length ? skillsList : ['General Assistance'],
      status: 'Available',
      rating: 5.0,
      tasks: 0,
      phone: this.newVolunteerPhone.trim() || '+1 (555) 555-0100',
      initials,
      avatarColor: randomColor
    });

    this.closeInviteModal();
  }

  assignVolunteer(v: Volunteer): void {
    window.alert(`Assign action triggered for ${v.name} (${v.id}).`);
  }

  viewVolunteer(v: Volunteer): void {
    window.alert(`Viewing detailed operational stats for ${v.name} (${v.id}).`);
  }
}