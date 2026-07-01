import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CitizenService } from '../Common/services/citizen.service';
import { EmergencyRequestService } from '../Common/services/emergency-request.service';
import { ShelterService } from '../services/shelter';
import { OnInit } from '@angular/core';
import { Citizen as CitizenModel } from '../Common/models/citizen';
import { HttpErrorResponse } from '@angular/common/http';

interface EmergencyRequest {
  id: string;
  type: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  responder: string;
  trackingMessage?: string;
  location: string;
  description: string;
}

interface ShelterInfo {
  id: string;
  name: string;
  distance: string;
  status: 'Available' | 'Limited' | 'Full' | string;
  bedsFree: number;
}

@Component({
  selector: 'app-citizen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './citizen.html',
  styleUrl: './citizen.css',
})
export class Citizen implements OnInit {
  citizen: CitizenModel | null = null;
  
  constructor(
    private citizenService: CitizenService,
    private emergencyService: EmergencyRequestService,
    private shelterService: ShelterService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadCitizen();
    this.loadRequests();
    this.loadShelters();
  }
  
  loadCitizen(): void {
    const email = localStorage.getItem('email') || 'citizen@araksha.com';
    this.citizenService.getCitizenByEmail(email).subscribe({
      next: (data: CitizenModel) => {
        this.citizen = data;
        this.contactPhone = data.phoneNumber;
        console.log('Citizen Loaded', data);
        // Refresh requests with citizen name loaded
        this.loadRequests();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error Loading Citizen', error);
      }
    });
  }

  loadRequests(): void {
    this.emergencyService.getAllRequests().subscribe({
      next: (requests) => {
        const citizenName = this.citizen?.fullName || 'Alice Smith';
        const filtered = requests.filter(r => r.citizenName === citizenName);
        if (filtered.length > 0) {
          this.myRequests = filtered.map(r => ({
            id: r.requestId,
            type: `${r.emergencyType || 'General'} Emergency`,
            date: r.requestTime ? new Date(r.requestTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: r.status === 'Completed' ? 'Resolved' : (r.status === 'Assigned' || r.status === 'In Progress' ? 'In Progress' : 'Pending'),
            responder: r.assignedVolunteer || '—',
            location: r.location,
            description: `${r.emergencyType} assistance requested.`
          }));
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching emergency requests:', err)
    });
  }

  // Modal State
  showModal = false;
  currentStep = 1;

  //citizen profile
  showProfile = false;
  toggleProfile(): void {
    this.showProfile = !this.showProfile;
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  // Form Fields
  selectedType = '';
  description = '';
  location = '';
  contactPhone = '';

  emergencyTypes = [
    'Flood',
    'Fire',
    'Earthquake',
    'Hurricane',
    'Tornado',
    'Medical Emergency',
    'Landslide',
    'Other'
  ];

  myRequests: EmergencyRequest[] = [
    {
      id: 'ER-2830',
      type: 'Flood Emergency',
      date: '2025-06-05',
      status: 'Resolved',
      responder: 'Tom Harris',
      location: '120 Houston Ave',
      description: 'Basement flooding rescue needed'
    },
    {
      id: 'ER-2847',
      type: 'Flood Emergency',
      date: '2025-06-07',
      status: 'In Progress',
      responder: 'James Wright',
      trackingMessage: 'James Wright en route · ETA 8 min',
      location: 'Houston, TX',
      description: 'Minor flooding in the backyard and entrance blocking'
    }
  ];

  shelters: ShelterInfo[] = [];

  loadShelters(): void {
    this.shelterService.getShelters().subscribe({
      next: (shelters) => {
        if (shelters && shelters.length > 0) {
          this.shelters = shelters.map(s => ({
            id: 'SH-' + (s.id || ''),
            name: s.name,
            distance: (1.0 + Math.random() * 3).toFixed(1) + ' mi away',
            status: s.status || 'Available',
            bedsFree: (s.capacity || 0) - (s.occupied || 0)
          }));
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching shelters:', err)
    });
  }

  openReportModal(): void {
    this.showModal = true;
    this.currentStep = 1;
    this.selectedType = '';
    this.description = '';
    this.location = '';
    this.contactPhone = this.citizen?.phoneNumber ?? '';
  }

  closeModal(): void {
    this.showModal = false;
  }

  selectType(type: string): void {
    this.selectedType = type;
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedType) return;
    if (this.currentStep === 2 && this.description.trim().length < 5) return;
    if (this.currentStep === 3 && this.location.trim().length < 5) return;
    
    if (this.currentStep < 4) {
      this.currentStep++;
    } else {
      this.submitRequest();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitRequest(): void {
    const reqId = 'ER-' + Math.floor(2800 + Math.random() * 100);
    const newRequestDto = {
      id: 0,
      requestId: reqId,
      citizenName: this.citizen?.fullName || 'Alice Smith',
      emergencyType: this.selectedType,
      priority: 'High' as const,
      status: 'Pending' as const,
      location: this.location,
      assignedVolunteer: '',
      requestTime: new Date().toISOString()
    };

    this.emergencyService.addRequest(newRequestDto).subscribe({
      next: () => {
        this.loadRequests();
        this.showModal = false;
      },
      error: (err) => {
        console.error('Error submitting request:', err);
        alert('Failed to submit emergency request.');
      }
    });
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}