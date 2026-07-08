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
import { FindByIdPipe } from '../../../../Common/pipes/find-by-id.pipe';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule, FindByIdPipe],
  templateUrl: './volunteers.component.html'
})
export class VolunteersComponent implements OnInit, OnDestroy {

  
  searchQuery = '';
  statusFilter: 'All' | 'Available' | 'On Duty' | 'Off Duty' = 'All';
  districtFilter = '';
  skillFilter = '';
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  viewMode: 'list' | 'grid' = 'list';

  
  currentPage = 0;          // 0-based (matches Spring)
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  
  inviteModalOpen = signal(false);
  viewModalOpen = signal(false);
  assignModalOpen = signal(false);

  selectedVolunteer = signal<Volunteer | null>(null);
  selectedVolunteerForAssign = signal<Volunteer | null>(null);
  activeRequests: any[] = [];
  selectedRequestIdForAssign = '';

  
  assignLoading = false;
  assignError = '';
  assignSuccess = false;

  newVolunteerName = '';
  newVolunteerLocation = '';
  newVolunteerPhone = '';
  predefinedSkills = [
    'Medical', 'First Aid', 'Water Rescue', 'Search & Rescue', 
    'Construction', 'Logistics', 'Communications', 'Firefighting', 'General Support'
  ];
  selectedSkillsForNewVolunteer: string[] = [];

  toggleNewVolunteerSkill(skill: string): void {
    const idx = this.selectedSkillsForNewVolunteer.indexOf(skill);
    if (idx >= 0) {
      this.selectedSkillsForNewVolunteer.splice(idx, 1);
    } else {
      this.selectedSkillsForNewVolunteer.push(skill);
    }
  }

  
  profilePhotoFile: File | null = null;
  profilePhotoUrl = '';
  profilePhotoProgress = 0;
  profilePhotoError = '';

  idVerificationDocFile: File | null = null;
  idVerificationDocUrl = '';
  idVerificationDocProgress = 0;
  idVerificationDocError = '';

  
  volunteers: Volunteer[] = [];

  
  filteredVolunteers: Volunteer[] = [];

  
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

    
    this.loadVolunteers();
    
    this.loadSearchPage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  

  
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

  

  
  onSearchChange(): void {
    this.searchSubject.next();
  }

  
  setStatusFilter(filter: 'All' | 'Available' | 'On Duty' | 'Off Duty'): void {
    this.statusFilter = filter;
    this.currentPage  = 0;
    this.loadSearchPage();
  }

  
  onDistrictChange(): void {
    this.currentPage = 0;
    this.searchSubject.next();
  }

  
  onSkillChange(): void {
    this.currentPage = 0;
    this.searchSubject.next();
  }

  
  setSortField(field: string, dir: 'asc' | 'desc' = 'asc'): void {
    this.sortField  = field;
    this.sortDir    = dir;
    this.currentPage = 0;
    this.loadSearchPage();
  }



  setPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadSearchPage();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  

  get totalCount(): number    { return this.volunteers.length; }
  get availableCount(): number { return this.volunteers.filter(v => v.status === 'Available').length; }
  get onDutyCount(): number   { return this.volunteers.filter(v => v.status === 'On Duty').length; }
  get offDutyCount(): number  { return this.volunteers.filter(v => v.status === 'Off Duty').length; }

  

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  

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
    this.selectedSkillsForNewVolunteer = [];
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

      skills: [...this.selectedSkillsForNewVolunteer],

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
    this.assignLoading = false;
    this.assignError = '';
    this.assignSuccess = false;
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
      this.assignError = 'Please select an emergency request.';
      return;
    }

    const req = this.activeRequests.find(r => r.id === Number(this.selectedRequestIdForAssign));
    if (!req) {
      this.assignError = 'Selected request not found. Please refresh and try again.';
      return;
    }

    this.assignLoading = true;
    this.assignError = '';
    this.assignSuccess = false;

    req.assignedVolunteer = v.name;
    if (req.status === 'Pending') {
      req.status = 'Assigned';
    }

    this.emergencyService.updateRequest(req.id, req).subscribe({
      next: () => {
        const updatedVolunteer = { ...v, status: 'On Duty' as const };
        this.volunteerService.updateVolunteer(v.id, updatedVolunteer).subscribe({
          next: () => {
            this.assignLoading = false;
            this.assignSuccess = true;
            this.loadVolunteers();
            this.loadSearchPage();
            
            setTimeout(() => this.closeAssignModal(), 1500);
          },
          error: (err) => {
            console.error('Error updating volunteer status:', err);
            this.assignLoading = false;
            this.assignSuccess = true; // request was still assigned
            this.loadVolunteers();
            this.loadSearchPage();
            setTimeout(() => this.closeAssignModal(), 1500);
          }
        });
      },
      error: (err) => {
        console.error('Error assigning volunteer to request:', err);
        this.assignLoading = false;
        this.assignError = 'Failed to assign volunteer. Please try again.';
        this.cdr.detectChanges();
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
}