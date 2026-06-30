import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CitizenService } from '../Common/services/citizen.service';
import { OnInit } from '@angular/core';
import { Citizen as CitizenModel } from '../Common/models/citizen';
import { HttpErrorResponse } from '@angular/common/http';

import { EmergencyRequestService } from '../Common/services/emergency-request.service';
import { EmergencyRequest as EmergencyRequestDto } from '../Common/models/emergency-request.model';

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
  status: 'Available' | 'Limited' | 'Full';
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
  private emergencyRequestService: EmergencyRequestService
) {}
  ngOnInit(): void {
  this.loadCitizen();
}
loadCitizen(): void {

  this.citizenService.getCitizenById(1).subscribe({

    next: (data: CitizenModel) => {

      this.citizen = data;

      this.contactPhone = data.phoneNumber;

      console.log('Citizen Loaded', data);

    },

    error: (error: HttpErrorResponse) => {

      console.error('Error Loading Citizen', error);

    }

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

  shelters: ShelterInfo[] = [
    { id: 'SH-101', name: 'Houston Community Center', distance: '1.2 mi away', status: 'Available', bedsFree: 68 },
    { id: 'SH-102', name: 'Riverside School Gym', distance: '2.8 mi away', status: 'Limited', bedsFree: 12 },
    { id: 'SH-103', name: 'Northside Relief Hub', distance: '4.1 mi away', status: 'Full', bedsFree: 0 }
  ];

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

  const request: EmergencyRequestDto = {

    id: 0,

    requestId: 'ER-' + Date.now(),

    citizenName: this.citizen?.fullName ?? 'Unknown Citizen',

    emergencyType: this.selectedType,

    priority: 'High',

    status: 'Pending',

    location: this.location,

    assignedVolunteer: '',

    requestTime: ''

  };

  this.emergencyRequestService.addRequest(request).subscribe({

    next: (savedRequest) => {

      // Show immediately in Citizen page

      this.myRequests.unshift({

        id: savedRequest.requestId,

        type: savedRequest.emergencyType,

        date: new Date(savedRequest.requestTime).toISOString().split('T')[0],

        status: 'Pending',

        responder: '—',

        location: savedRequest.location,

        description: this.description

      });

      alert('Emergency Request Submitted Successfully');

      this.showModal = false;

    },

    error: (err) => {

      console.error(err);

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