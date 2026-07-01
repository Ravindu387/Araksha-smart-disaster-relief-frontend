import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { EmergencyRequest as EmergencyRequestDto } from '../../../../Common/models/emergency-request.model';

interface EmergencyRequest {

  id: string;

  dbId: number;

  initials: string;

  citizen: string;

  type: string;

  priority: 'Critical' | 'High' | 'Medium' | 'Low';

  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Completed';

  location: string;

  volunteer: string;

  time: string;

}
@Component({
  selector: 'app-emergency-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emergency-requests.component.html',
  styleUrls: ['./emergency-requests.component.css']
})
export class EmergencyRequestsComponent implements OnInit {

  requests: EmergencyRequest[] = [];

  constructor(
  private emergencyRequestService: EmergencyRequestService,
  private cdr: ChangeDetectorRef
) {}
ngOnInit(): void {
    this.loadRequests();
}
  private loadRequests(): void {
    this.emergencyRequestService.getAllRequests().subscribe({
      next: (data: any[]) => {
        this.requests = data.map(r => {
          let timeFormatted = '—';
          if (r.requestTime) {
            const dateObj = new Date(r.requestTime);
            if (!isNaN(dateObj.getTime())) {
              timeFormatted = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          }

          return {
            id: `ER-${r.id.toString().padStart(4, '0')}`,
            dbId: r.id,
            initials: this.generateInitials(r.citizenName),
            citizen: r.citizenName || 'Unknown Citizen',
            type: r.emergencyType || 'General',
            priority: r.priority || 'Medium',
            status: r.status || 'Pending',
            location: r.location || 'Unknown Location',
            volunteer: r.assignedVolunteer || '—',
            time: timeFormatted
          };
        });
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  resolveRequest(item: EmergencyRequest): void {
    const updatedDto = {
      id: item.dbId,
      requestId: item.id,
      citizenName: item.citizen,
      emergencyType: item.type,
      priority: item.priority,
      status: 'Completed' as const,
      location: item.location,
      assignedVolunteer: item.volunteer === '—' ? '' : item.volunteer,
      requestTime: new Date().toISOString()
    };

    this.emergencyRequestService.updateRequest(item.dbId, updatedDto).subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error resolving request:', err);
        alert('Failed to resolve request.');
      }
    });
  }

  private generateInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  searchQuery = '';
  typeFilter = 'All';
  statusFilter = 'All';
  priorityFilter = 'All';

  currentPage = 1;
  readonly pageSize = 6;

  readonly types = ['All', 'Flood', 'Fire', 'Earthquake', 'Medical', 'Hurricane', 'Landslide'];
  readonly statuses = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
  readonly priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  get filteredRequests(): EmergencyRequest[] {

  const q = this.searchQuery.toLowerCase();

  return this.requests.filter(r => {

    const matchesSearch =
      !q ||
      r.citizen.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q);

    const matchesType =
      this.typeFilter === 'All' ||
      r.type === this.typeFilter;

    const matchesStatus =
      this.statusFilter === 'All' ||
      r.status === this.statusFilter;

    const matchesPriority =
      this.priorityFilter === 'All' ||
      r.priority === this.priorityFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesPriority
    );

  });

}

  get paginatedRequests(): EmergencyRequest[] {

  const start =
    (this.currentPage - 1) * this.pageSize;

  return this.filteredRequests.slice(
    start,
    start + this.pageSize
  );

}

  get totalPages(): number {

  return Math.ceil(
    this.filteredRequests.length /
    this.pageSize
  );

}

  get countByPriority(): Record<string, number> {

  return {

    Critical:
      this.requests.filter(r =>
        r.priority === 'Critical'
      ).length,

    High:
      this.requests.filter(r =>
        r.priority === 'High'
      ).length,

    Medium:
      this.requests.filter(r =>
        r.priority === 'Medium'
      ).length,

    Low:
      this.requests.filter(r =>
        r.priority === 'Low'
      ).length

  };

}

  setPriorityFilter(priority: string): void {

  this.priorityFilter = priority;

  this.currentPage = 1;

}

  setPage(page: number): void {

  if (
    page >= 1 &&
    page <= this.totalPages
  ) {

    this.currentPage = page;

  }

}

  onSearch(): void {

  this.currentPage = 1;

}

  exportCsv(): void {
    const headers = ['ID', 'Citizen', 'Type', 'Priority', 'Status', 'Location', 'Volunteer', 'Time'];
    const rows = this.requests.map(r =>
      [r.id, r.citizen, r.type, r.priority, r.status, r.location, r.volunteer, r.time].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emergency-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      Critical: 'bg-rose-100 text-rose-600',
      High:     'bg-amber-100 text-amber-600',
      Medium:   'bg-yellow-100 text-yellow-700',
      Low:      'bg-emerald-100 text-emerald-600',
    };
    return map[priority] ?? 'bg-gray-100 text-gray-600';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pending:      'bg-gray-100 text-gray-600',
      Assigned:     'bg-violet-100 text-violet-600',
      'In Progress':'bg-blue-100 text-blue-600',
      Resolved:     'bg-emerald-100 text-emerald-600',
      Completed:    'bg-emerald-100 text-emerald-600',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      Flood:     'bg-blue-100 text-blue-600',
      Fire:      'bg-orange-100 text-orange-600',
      Earthquake:'bg-amber-100 text-amber-600',
      Medical:   'bg-rose-100 text-rose-600',
      Hurricane: 'bg-purple-100 text-purple-600',
      Landslide: 'bg-slate-100 text-slate-600',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }
}