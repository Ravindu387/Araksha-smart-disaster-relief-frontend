import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
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
  viewModalOpen = signal(false);
  assignModalOpen = signal(false);

  selectedVolunteer = signal<Volunteer | null>(null);
  selectedVolunteerForAssign = signal<Volunteer | null>(null);
  activeRequests: any[] = [];
  selectedRequestIdForAssign = '';

  newVolunteerName = '';
  newVolunteerLocation = '';
  newVolunteerPhone = '';
  newVolunteerSkills = '';

  volunteers: Volunteer[] = [];

  constructor(
    private volunteerService: VolunteerService,
    private emergencyService: EmergencyRequestService,
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
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
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
    this.selectedVolunteerForAssign.set(v);
    this.selectedRequestIdForAssign = '';
    this.loadActiveRequests();
    this.assignModalOpen.set(true);
  }

  viewVolunteer(v: Volunteer): void {
    this.selectedVolunteer.set(v);
    this.viewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.selectedVolunteer.set(null);
  }

  closeAssignModal(): void {
    this.assignModalOpen.set(false);
    this.selectedVolunteerForAssign.set(null);
    this.selectedRequestIdForAssign = '';
  }

  loadActiveRequests(): void {
    this.emergencyService.getAllRequests().subscribe({
      next: (requests) => {
        this.activeRequests = requests.filter(r => r.status !== 'Completed');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading active requests for assignment:', err)
    });
  }

  assignVolunteerSubmit(): void {
    const v = this.selectedVolunteerForAssign();
    if (!v) return;

    if (!this.selectedRequestIdForAssign) {
      alert('Please select an emergency request.');
      return;
    }

    const req = this.activeRequests.find(r => r.id === Number(this.selectedRequestIdForAssign));
    if (!req) return;

    req.assignedVolunteer = v.name;
    if (req.status === 'Pending') {
      req.status = 'In Progress';
    }

    this.emergencyService.updateRequest(req.id, req).subscribe({
      next: () => {
        v.status = 'On Duty';
        this.volunteerService.updateVolunteer(v.id, v).subscribe({
          next: () => {
            this.loadVolunteers();
            this.closeAssignModal();
          },
          error: (err) => {
            console.error('Error updating volunteer status:', err);
            alert('Assigned volunteer, but failed to update volunteer status.');
          }
        });
      },
      error: (err) => {
        console.error('Error updating emergency request with volunteer:', err);
        alert('Failed to assign volunteer to request.');
      }
    });
  }

}