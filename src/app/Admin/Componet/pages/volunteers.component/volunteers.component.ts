import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { Volunteer } from '../../../../Common/models/volunteer.model';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteers.component.html'
})
export class VolunteersComponent implements OnInit {

  searchQuery = '';
  statusFilter: 'All' | 'Available' | 'On Duty' | 'Off Duty' = 'All';
  viewMode: 'list' | 'grid' = 'list';

  inviteModalOpen = signal(false);

  newVolunteerName = '';
  newVolunteerLocation = '';
  newVolunteerPhone = '';
  newVolunteerSkills = '';

  volunteers: Volunteer[] = [];

  constructor(
    private volunteerService: VolunteerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVolunteers();
  }

  private loadVolunteers(): void {

    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-amber-600',
      'bg-teal-600',
      'bg-indigo-600',
      'bg-pink-600'
    ];

    this.volunteerService.getAllVolunteers().subscribe({

      next: (data: any[]) => {

        this.volunteers = data.map((v, index) => ({
          ...v,
          displayId: `V-${v.id.toString().padStart(4, '0')}`,
          initials: this.generateInitials(v.name),
          avatarColor: colors[index % colors.length]
        }));

        // Force Angular to refresh the UI
        this.cdr.detectChanges();

      },

      error: (err) => {
        console.error('Load Volunteers Error', err);
      }

    });

  }

  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map(x => x.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

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
        v.skills.some(skill =>
          skill.toLowerCase().includes(this.searchQuery.toLowerCase())
        );

      const matchesStatus =
        this.statusFilter === 'All' ||
        v.status === this.statusFilter;

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

    if (!this.newVolunteerName.trim()) {
      alert('Please enter a full name.');
      return;
    }

    if (!this.newVolunteerPhone.trim()) {
      alert('Please enter a phone number.');
      return;
    }

    const volunteer: Volunteer = {

      id: 0,

      name: this.newVolunteerName.trim(),

      location: this.newVolunteerLocation.trim() || 'Unknown',

      skills: this.newVolunteerSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),

      status: 'Available',

      rating: 5,

      tasks: 0,

      phone: this.newVolunteerPhone.trim(),

      initials: '',

      avatarColor: ''

    };

    this.volunteerService.addVolunteer(volunteer).subscribe({

      next: () => {

        this.loadVolunteers();
        this.closeInviteModal();

      },

      error: err => {

        console.error(err);
        alert('Failed to save volunteer.');

      }

    });

  }

  assignVolunteer(v: Volunteer): void {
    alert(`Assign ${v.name}`);
  }

  viewVolunteer(v: Volunteer): void {
    alert(`View ${v.name}`);
  }

}