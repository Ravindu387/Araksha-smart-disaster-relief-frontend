import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EmergencyRequest {
  id: string;
  initials: string;
  citizen: string;
  type: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';
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
export class EmergencyRequestsComponent {

  requests: EmergencyRequest[] = [
    { id: 'ER-2847', initials: 'MS', citizen: 'Maria Santos',   type: 'Flood',     priority: 'Critical', status: 'In Progress', location: 'Houston, TX',       volunteer: 'James Wright',    time: '14:10' },
    { id: 'ER-2846', initials: 'RK', citizen: 'Robert Kim',     type: 'Fire',      priority: 'High',     status: 'Assigned',   location: 'Los Angeles, CA',   volunteer: 'Lisa Chen',       time: '13:52' },
    { id: 'ER-2845', initials: 'AP', citizen: 'Aisha Patel',    type: 'Medical',   priority: 'Medium',   status: 'Resolved',   location: 'Chicago, IL',       volunteer: 'Anna Rodriguez',  time: '13:05' },
    { id: 'ER-2844', initials: 'DB', citizen: 'David Brown',    type: 'Earthquake',priority: 'Critical', status: 'Pending',    location: 'San Jose, CA',      volunteer: '—',               time: '13:22' },
    { id: 'ER-2843', initials: 'EW', citizen: 'Emma Wilson',    type: 'Hurricane', priority: 'High',     status: 'In Progress',location: 'Miami, FL',         volunteer: 'Michael Davis',   time: '12:45' },
    { id: 'ER-2842', initials: 'TL', citizen: 'Tom Lee',        type: 'Flood',     priority: 'Medium',   status: 'Assigned',   location: 'New Orleans, LA',   volunteer: 'Sarah Connor',    time: '12:10' },
    { id: 'ER-2841', initials: 'PS', citizen: 'Priya Sharma',   type: 'Flood',     priority: 'Low',      status: 'Pending',    location: 'Phoenix, AZ',       volunteer: '—',               time: '11:30' },
    { id: 'ER-2840', initials: 'JD', citizen: 'James Doe',      type: 'Medical',   priority: 'High',     status: 'Resolved',   location: 'Dallas, TX',        volunteer: 'Tom Harris',      time: '10:55' },
  ];

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
      const matchesSearch = !q || r.citizen.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
      const matchesType = this.typeFilter === 'All' || r.type === this.typeFilter;
      const matchesStatus = this.statusFilter === 'All' || r.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'All' || r.priority === this.priorityFilter;
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }

  get paginatedRequests(): EmergencyRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRequests.length / this.pageSize);
  }

  get countByPriority(): Record<string, number> {
    return {
      Critical: this.requests.filter(r => r.priority === 'Critical').length,
      High:     this.requests.filter(r => r.priority === 'High').length,
      Medium:   this.requests.filter(r => r.priority === 'Medium').length,
      Low:      this.requests.filter(r => r.priority === 'Low').length,
    };
  }

  setPriorityFilter(p: string): void {
    this.priorityFilter = p;
    this.currentPage = 1;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
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