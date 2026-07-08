import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchService } from '../../../../Common/services/search.service';

import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { EmergencyRequest as EmergencyRequestDto } from '../../../../Common/models/emergency-request.model';
import { Icon } from '../../../../Common/icon/icon';

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

  requestTime?: string;

}

@Component({
  selector: 'app-emergency-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './emergency-requests.component.html',
  styleUrls: ['./emergency-requests.component.css']
})
export class EmergencyRequestsComponent implements OnInit, OnDestroy {

  
  requests: EmergencyRequest[] = [];

  
  searchQuery = '';
  typeFilter = 'All';
  statusFilter = 'All';
  priorityFilter = 'All';
  districtFilter = '';
  dateFrom = '';
  dateTo   = '';
  sortField = 'requestTime';
  sortDir: 'asc' | 'desc' = 'desc';

  
  currentPage = 1;         // 1-based for display; converted to 0-based for API
  readonly pageSize = 6;
  totalPages = 0;
  totalElements = 0;

  
  /** Replaces the old client-side filteredRequests getter. */
  filteredRequests: EmergencyRequest[] = [];

  /** paginatedRequests returns filteredRequests directly (server already paged). */
  get paginatedRequests(): EmergencyRequest[] {
    return this.filteredRequests;
  }

  
  readonly types      = ['All', 'Flood', 'Fire', 'Earthquake', 'Medical', 'Hurricane', 'Landslide'];
  readonly statuses   = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
  readonly priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  
  private searchSubject = new Subject<void>();
  private subscriptions = new Subscription();

  
  resolveError = '';

  
  editModalOpen = false;
  editingRequest: EmergencyRequest | null = null;
  editCitizenName = '';
  editEmergencyType = '';
  editPriority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  editStatus: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' = 'Pending';
  editLocation = '';
  editVolunteer = '';
  editSaving = false;
  editError = '';

  
  createModalOpen = false;
  createCitizenName = '';
  createEmergencyType = 'Flood';
  createPriority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  createLocation = '';
  createSaving = false;
  createError = '';

  readonly emergencyTypes = ['Flood', 'Fire', 'Earthquake', 'Medical', 'Hurricane', 'Landslide'];
  readonly priorityLevels: ('Critical' | 'High' | 'Medium' | 'Low')[] = ['Critical', 'High', 'Medium', 'Low'];
  readonly statusOptions: ('Pending' | 'Assigned' | 'In Progress' | 'Completed')[] =
    ['Pending', 'Assigned', 'In Progress', 'Completed'];

  constructor(
    private emergencyRequestService: EmergencyRequestService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  

  ngOnInit(): void {
    // Wire debounced search
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 1;
        this.loadSearchPage();
      })
    );

    
    this.subscriptions.add(
      this.searchService.searchQuery$.subscribe(q => {
        if (this.searchQuery !== q) {
          this.searchQuery = q;
          this.searchSubject.next();
        }
      })
    );

    // Load full list once for stat cards
    this.loadRequests();
    // Load first page of search results
    this.loadSearchPage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  

  /** Loads ALL requests (for countByPriority stat cards). */
  private loadRequests(): void {
    this.emergencyRequestService.getAllRequests().subscribe({
      next: (data: any[]) => {
        this.requests = data.map(r => this.mapDto(r));
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  /** Loads the current search page from the server. */
  private loadSearchPage(): void {
    const sort = `${this.sortField},${this.sortDir}`;

    this.emergencyRequestService.searchRequests({
      keyword:     this.searchQuery.trim() || undefined,
      status:      this.statusFilter === 'All'   ? undefined : this.statusFilter,
      priority:    this.priorityFilter === 'All' ? undefined : this.priorityFilter,
      disasterType:this.typeFilter === 'All'     ? undefined : this.typeFilter,
      district:    this.districtFilter.trim() || undefined,
      dateFrom:    this.dateFrom || undefined,
      dateTo:      this.dateTo   || undefined,
      page:        this.currentPage - 1,    // convert 1-based display to 0-based API
      size:        this.pageSize,
      sort
    }).subscribe({
      next: (page) => {
        this.filteredRequests = page.content.map(r => this.mapDto(r as any));
        this.totalPages    = page.totalPages;
        this.totalElements = page.totalElements;
        this.cdr.detectChanges();
      },
      error: err => console.error('Search Error', err)
    });
  }

  

  onSearch(): void {
    this.searchSubject.next();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSearchPage();
  }

  onDateChange(): void {
    this.currentPage = 1;
    this.loadSearchPage();
  }

  setPriorityFilter(priority: string): void {
    this.priorityFilter = priority;
    this.currentPage    = 1;
    this.loadSearchPage();
  }

  setSortField(field: string, dir: 'asc' | 'desc' = 'desc'): void {
    this.sortField   = field;
    this.sortDir     = dir;
    this.currentPage = 1;
    this.loadSearchPage();
  }

  

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSearchPage();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  

  get countByPriority(): Record<string, number> {
    return {
      Critical: this.requests.filter(r => r.priority === 'Critical').length,
      High:     this.requests.filter(r => r.priority === 'High').length,
      Medium:   this.requests.filter(r => r.priority === 'Medium').length,
      Low:      this.requests.filter(r => r.priority === 'Low').length
    };
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
        this.resolveError = '';
        this.loadRequests();
        this.loadSearchPage();
      },
      error: (err) => {
        console.error('Error resolving request:', err);
        this.resolveError = `Failed to resolve ${item.id}. Please try again.`;
        setTimeout(() => { this.resolveError = ''; }, 5000);
      }
    });
  }

  deleteRequest(item: EmergencyRequest): void {
    if (confirm(`Are you sure you want to delete emergency request ${item.id}?`)) {
      this.emergencyRequestService.deleteRequest(item.dbId).subscribe({
        next: () => {
          this.loadRequests();
          this.loadSearchPage();
        },
        error: (err) => {
          console.error('Error deleting request:', err);
          // Fallback local update in case backend is offline/mock
          this.requests = this.requests.filter(r => r.dbId !== item.dbId);
          this.filteredRequests = this.filteredRequests.filter(r => r.dbId !== item.dbId);
          this.cdr.detectChanges();
        }
      });
    }
  }

  

  openEditModal(item: EmergencyRequest): void {
    this.editingRequest = item;
    this.editCitizenName = item.citizen;
    this.editEmergencyType = item.type;
    this.editPriority = item.priority;
    this.editStatus = (item.status === 'Resolved' ? 'Completed' : item.status) as 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
    this.editLocation = item.location;
    this.editVolunteer = item.volunteer === '—' ? '' : item.volunteer;
    this.editError = '';
    this.editSaving = false;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.editingRequest = null;
    this.editError = '';
    this.editSaving = false;
  }

  submitEdit(): void {
    if (!this.editingRequest) return;
    if (!this.editCitizenName.trim() || !this.editLocation.trim()) {
      this.editError = 'Citizen name and location are required.';
      return;
    }
    this.editSaving = true;
    this.editError = '';
    const updatedDto = {
      id: this.editingRequest.dbId,
      requestId: this.editingRequest.id,
      citizenName: this.editCitizenName.trim(),
      emergencyType: this.editEmergencyType,
      priority: this.editPriority,
      status: this.editStatus,
      location: this.editLocation.trim(),
      assignedVolunteer: this.editVolunteer.trim(),
      requestTime: this.editingRequest.requestTime || new Date().toISOString()
    };
    this.emergencyRequestService.updateRequest(this.editingRequest.dbId, updatedDto as any).subscribe({
      next: () => {
        this.editSaving = false;
        this.loadRequests();
        this.loadSearchPage();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error editing request:', err);
        this.editSaving = false;
        this.editError = 'Failed to save changes. Please try again.';
      }
    });
  }

  

  openCreateModal(): void {
    this.createCitizenName = '';
    this.createEmergencyType = 'Flood';
    this.createPriority = 'Medium';
    this.createLocation = '';
    this.createError = '';
    this.createSaving = false;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
    this.createError = '';
    this.createSaving = false;
  }

  submitCreate(): void {
    if (!this.createCitizenName.trim() || !this.createLocation.trim()) {
      this.createError = 'Citizen name and location are required.';
      return;
    }
    this.createSaving = true;
    this.createError = '';
    const nextId = `ER-${String(Date.now()).slice(-4).padStart(4, '0')}`;
    const newRequest: any = {
      requestId: nextId,
      citizenName: this.createCitizenName.trim(),
      emergencyType: this.createEmergencyType,
      priority: this.createPriority,
      status: 'Pending',
      location: this.createLocation.trim(),
      assignedVolunteer: '',
      requestTime: new Date().toISOString()
    };
    this.emergencyRequestService.addRequest(newRequest).subscribe({
      next: () => {
        this.createSaving = false;
        this.loadRequests();
        this.loadSearchPage();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating request:', err);
        this.createSaving = false;
        this.createError = 'Failed to create request. Please try again.';
      }
    });
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

  

  private mapDto(r: any): EmergencyRequest {
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
      id: `ER-${(r.id || r.dbId || 0).toString().padStart(4, '0')}`,
      dbId: r.id || r.dbId,
      initials: this.generateInitials(r.citizenName || r.citizen),
      citizen: r.citizenName || r.citizen || 'Unknown Citizen',
      type: r.emergencyType || r.type || 'General',
      priority: r.priority || 'Medium',
      status: r.status || 'Pending',
      location: r.location || 'Unknown Location',
      volunteer: r.assignedVolunteer || r.volunteer || '—',
      time: timeFormatted,
      requestTime: r.requestTime
    };
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
}