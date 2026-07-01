import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CitizenService } from '../Common/services/citizen.service';
import { EmergencyRequestService } from '../Common/services/emergency-request.service';
import { ShelterService } from '../services/shelter';
import { NotificationService, NotificationItem } from '../Common/services/notification.service';
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

interface CitizenNotification {
  id: number;
  title: string;
  description: string;
  severity: string;
  badge: string;
  time: string;
  isLocal: boolean;
  category: string;
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
  notifications: CitizenNotification[] = [];
  
  constructor(
    private citizenService: CitizenService,
    private emergencyService: EmergencyRequestService,
    private shelterService: ShelterService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadCitizen();
    this.loadRequests();
    this.loadShelters();
    this.loadNotifications();
  }
  
  loadCitizen(): void {
    const email = localStorage.getItem('email') || 'citizen@araksha.com';
    this.citizenService.getCitizenByEmail(email).subscribe({
      next: (data: CitizenModel) => {
        this.citizen = data;
        this.contactPhone = data.phoneNumber;
        console.log('Citizen Loaded', data);
        // Refresh requests and notifications with citizen info loaded
        this.loadRequests();
        this.loadNotifications();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error Loading Citizen', error);
      }
    });
  }

  isLocalAlert(notification: NotificationItem): boolean {
    if (!this.citizen) return false;
    const locationKeywords = ['houston', 'harris', 'texas', 'tx'];
    const title = (notification.title || '').toLowerCase();
    const desc = (notification.description || '').toLowerCase();
    
    const addressParts = this.citizen.address ? this.citizen.address.toLowerCase().split(/[,\s]+/) : [];
    const keywords = new Set([...locationKeywords, ...addressParts].filter(w => w.length > 2));
    
    for (const keyword of keywords) {
      if (title.includes(keyword) || desc.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        // Filter ONLY emergency notifications (category is 'alerts')
        const emergencyOnly = data.filter(item => item.category === 'alerts');
        
        this.notifications = emergencyOnly.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          severity: item.severity,
          badge: item.badge,
          time: item.time || 'Just now',
          category: item.category,
          isLocal: this.isLocalAlert(item)
        }));
        
        // Prioritize local alerts first
        this.notifications.sort((a, b) => {
          if (a.isLocal && !b.isLocal) return -1;
          if (!a.isLocal && b.isLocal) return 1;
          return 0;
        });
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading notifications:', err)
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
  showSosConfirm = false;
  sosLoading = false;

  //citizen profile
  showProfile = false;
  showNotifications = false;

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
    if (this.showProfile) {
      this.showNotifications = false;
    }
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfile = false;
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
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

  openSosConfirm(): void {
    this.showSosConfirm = true;
  }

  closeSosConfirm(): void {
    this.showSosConfirm = false;
  }

  sendQuickSos(): void {
    this.sosLoading = true;
    const reqId = 'ER-' + Math.floor(2800 + Math.random() * 100);
    const sosDto = {
      id: 0,
      requestId: reqId,
      citizenName: this.citizen?.fullName || 'Alice Smith',
      emergencyType: 'Critical SOS',
      priority: 'Critical' as const,
      status: 'Pending' as const,
      location: this.citizen?.address || 'Current Location',
      assignedVolunteer: '',
      requestTime: new Date().toISOString()
    };

    this.emergencyService.addRequest(sosDto).subscribe({
      next: () => {
        this.loadRequests();
        this.sosLoading = false;
        this.showSosConfirm = false;
        alert('🚨 Quick SOS Alert Dispatched! Rescue teams are being routed to your location.');
      },
      error: (err) => {
        console.error('Error dispatching SOS:', err);
        this.sosLoading = false;
        alert('Failed to dispatch Quick SOS.');
      }
    });
  }

  selectType(type: string): void {
    this.selectedType = type;
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedType) return;
    if (this.currentStep === 2 && this.description.trim().length < 5) return;
    if (this.currentStep === 3 && this.location.trim().length < 5) return;
    if (this.currentStep === 4 && (!this.contactPhone || this.contactPhone.trim().length < 5)) return;
    
    if (this.currentStep < 5) {
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