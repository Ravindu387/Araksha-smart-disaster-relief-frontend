import {
  Component, OnInit, OnDestroy, signal, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpEventType } from '@angular/common/http';

import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { FileUploadService } from '../../../../Common/services/file-upload.service';
import { SearchService } from '../../../../Common/services/search.service';
import { Volunteer } from '../../../../Common/models/volunteer.model';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteers.component.html'
})
export class VolunteersComponent implements OnInit, OnDestroy {

  // ── Search / Filter state (same names as before — template bindings intact) ──
  searchQuery = '';
  statusFilter: 'All' | 'Available' | 'On Duty' | 'Off Duty' = 'All';
  districtFilter = '';
  skillFilter = '';
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  viewMode: 'list' | 'grid' = 'list';

  // ── Pagination state ──────────────────────────────────────────────────────
  currentPage = 0;          // 0-based (matches Spring)
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // ── Modal state (unchanged) ───────────────────────────────────────────────
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

  // ── File Upload state ─────────────────────────────────────────────────────
  profilePhotoFile: File | null = null;
  profilePhotoUrl = '';
  profilePhotoProgress = 0;
  profilePhotoError = '';

  idVerificationDocFile: File | null = null;
  idVerificationDocUrl = '';
  idVerificationDocProgress = 0;
  idVerificationDocError = '';

  // ── Data arrays ───────────────────────────────────────────────────────────
  /** All volunteers (used for summary counts: total/available/onDuty/offDuty) */
  volunteers: Volunteer[] = [];

  /** Current page of filtered volunteers (replaces the old getter) */
  filteredVolunteers: Volunteer[] = [];

  // ── Internal ──────────────────────────────────────────────────────────────
  private searchSubject = new Subject<void>();
  private subscriptions = new Subscription();

  private readonly avatarColors = [
    'bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-600',
    'bg-amber-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600'
  ];

  constructor(
    private volunteerService: VolunteerService,
    private emergencyService: EmergencyRequestService,
    private fileUploadService: FileUploadService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Wire debounced search
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 0;
        this.loadSearchPage();
      })
    );

    // Wire global header search service subscription
    this.subscriptions.add(
      this.searchService.searchQuery$.subscribe(q => {
        console.log('[VolunteersComponent] searchQuery$ received:', q);
        if (this.searchQuery !== q) {
          console.log('[VolunteersComponent] Updating searchQuery to:', q);
          this.searchQuery = q;
          this.searchSubject.next();
        }
      })
    );

    // Load summary counts (unfiltered) once
    this.loadVolunteers();
    // Load first page of search results
    this.loadSearchPage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Load helpers ──────────────────────────────────────────────────────────

  /** Loads ALL volunteers for the summary stat cards (no filters). */
  private loadVolunteers(): void {
    this.volunteerService.getAllVolunteers().subscribe({
      next: (data: any[]) => {
        this.volunteers = data.map((v, index) => ({
          ...v,
          displayId: `V-${v.id.toString().padStart(4, '0')}`,
          initials: this.generateInitials(v.name),
          avatarColor: this.avatarColors[index % this.avatarColors.length]
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Load Volunteers Error', err)
    });
  }

  /** Loads the current search page from the server. */
  private loadSearchPage(): void {
    const sort = `${this.sortField},${this.sortDir}`;

    this.volunteerService.searchVolunteers({
      keyword:  this.searchQuery.trim() || undefined,
      status:   this.statusFilter === 'All' ? undefined : this.statusFilter,
      district: this.districtFilter.trim() || undefined,
      skill:    this.skillFilter.trim() || undefined,
      page:     this.currentPage,
      size:     this.pageSize,
      sort
    }).subscribe({
      next: (page) => {
        this.filteredVolunteers = page.content.map((v: any, index: number) => ({
          ...v,
          displayId: `V-${v.id.toString().padStart(4, '0')}`,
          initials: this.generateInitials(v.name),
          avatarColor: this.avatarColors[
            (this.currentPage * this.pageSize + index) % this.avatarColors.length
          ]
        }));
        this.totalPages    = page.totalPages;
        this.totalElements = page.totalElements;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Search Volunteers Error', err)
    });
  }

  // ── File Selection & Upload Handlers ──────────────────────────────────────

  onProfilePhotoSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.profilePhotoFile = files[0];
      this.profilePhotoError = '';
      this.profilePhotoProgress = 0;
      this.uploadProfilePhoto();
    }
  }

  uploadProfilePhoto(): void {
    if (!this.profilePhotoFile) return;

    this.fileUploadService.uploadFile(this.profilePhotoFile, 'ADMIN').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.profilePhotoProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.profilePhotoUrl = event.body.fileUrl;
          this.profilePhotoProgress = 100;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.profilePhotoProgress = 0;
        this.profilePhotoError = err.error?.error || 'Failed to upload photo';
        this.cdr.detectChanges();
      }
    });
  }

  removeProfilePhoto(): void {
    this.profilePhotoFile = null;
    this.profilePhotoUrl = '';
    this.profilePhotoProgress = 0;
    this.profilePhotoError = '';
  }

  onIdVerificationDocSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.idVerificationDocFile = files[0];
      this.idVerificationDocError = '';
      this.idVerificationDocProgress = 0;
      this.uploadIdVerificationDoc();
    }
  }

  uploadIdVerificationDoc(): void {
    if (!this.idVerificationDocFile) return;

    this.fileUploadService.uploadFile(this.idVerificationDocFile, 'ADMIN').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.idVerificationDocProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.idVerificationDocUrl = event.body.fileUrl;
          this.idVerificationDocProgress = 100;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.idVerificationDocProgress = 0;
        this.idVerificationDocError = err.error?.error || 'Failed to upload document';
        this.cdr.detectChanges();
      }
    });
  }

  removeIdVerificationDoc(): void {
    this.idVerificationDocFile = null;
    this.idVerificationDocUrl = '';
    this.idVerificationDocProgress = 0;
    this.idVerificationDocError = '';
  }

  // ── Search / filter triggers ──────────────────────────────────────────────

  /** Called from template on search input change. */
  onSearchChange(): void {
    this.searchSubject.next();
  }

  /** Called from template when a status filter button is clicked. */
  setStatusFilter(filter: 'All' | 'Available' | 'On Duty' | 'Off Duty'): void {
    this.statusFilter = filter;
    this.currentPage  = 0;
    this.loadSearchPage();
  }

  /** Called from template when district filter changes. */
  onDistrictChange(): void {
    this.currentPage = 0;
    this.searchSubject.next();
  }

  /** Called from template when skill filter changes. */
  onSkillChange(): void {
    this.currentPage = 0;
    this.searchSubject.next();
  }

  /** Called from template when sort changes. */
  setSortField(field: string, dir: 'asc' | 'desc' = 'asc'): void {
    this.sortField  = field;
    this.sortDir    = dir;
    this.currentPage = 0;
    this.loadSearchPage();
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  setPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadSearchPage();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ── Summary counts (computed from the full unfiltered list) ───────────────

  get totalCount(): number    { return this.volunteers.length; }
  get availableCount(): number { return this.volunteers.filter(v => v.status === 'Available').length; }
  get onDutyCount(): number   { return this.volunteers.filter(v => v.status === 'On Duty').length; }
  get offDutyCount(): number  { return this.volunteers.filter(v => v.status === 'Off Duty').length; }

  // ── View mode ─────────────────────────────────────────────────────────────

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  // ── Modal logic (unchanged) ───────────────────────────────────────────────

  openInviteModal(): void {
    this.inviteModalOpen.set(true);
    this.removeProfilePhoto();
    this.removeIdVerificationDoc();
  }

  closeInviteModal(): void {
    this.inviteModalOpen.set(false);
    this.newVolunteerName = '';
    this.newVolunteerLocation = '';
    this.newVolunteerPhone = '';
    this.newVolunteerSkills = '';
    this.removeProfilePhoto();
    this.removeIdVerificationDoc();
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

      profilePhotoUrl: this.profilePhotoUrl || undefined,

      idVerificationDocUrl: this.idVerificationDocUrl || undefined,

      initials: '',

      avatarColor: ''

    };

    this.volunteerService.addVolunteer(volunteer).subscribe({

      next: () => {
        this.loadVolunteers();
        this.loadSearchPage();
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
            this.loadSearchPage();
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

  // ── Helpers ───────────────────────────────────────────────────────────────

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
}