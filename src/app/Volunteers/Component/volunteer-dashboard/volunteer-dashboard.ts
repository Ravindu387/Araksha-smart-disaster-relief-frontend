import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { VolunteerHubService, TaskResponse } from '../../../Common/services/volunteerhub.service';
import { EmergencyRequest } from '../../../Common/models/emergency-request.model';
import { ShelterService } from '../../../services/shelter';

declare const L: any;

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './volunteer-dashboard.html'
})
export class VolunteerDashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  private volunteerhubService = inject(VolunteerHubService);
  private shelterService = inject(ShelterService);
  private location = inject(Location);

  private map: any;
  private markersGroup: any;
  private coordsMap = new Map<string, { lat: number, lng: number }>();

  volunteerDetails: any = null;

  volunteer = {
    name: 'Loading...',
    volunteerCode: '---',
    status: 'Offline'
  };

  // STAT CARDS
  stats = [
    {
      icon: '✓',
      value: '0',
      title: 'Tasks Completed',
      bg: 'bg-green-100'
    },
    {
      icon: '◷',
      value: '0',
      title: 'Active Tasks',
      bg: 'bg-blue-100'
    },
    {
      icon: '☆',
      value: '0.0',
      title: 'Citizen Rating',
      bg: 'bg-yellow-100'
    },
    {
      icon: '🏅',
      value: '0',
      title: 'Impact Score',
      bg: 'bg-purple-100'
    }
  ];

  // ASSIGNED TASKS
  tasks: any[] = [];

  // NEARBY REQUESTS
  openRequests: any[] = [];

  // NEEDS
  needs: string[] = ['Water Rescue', 'Food', 'Blankets'];

  // COMPLETED TASKS
  completedTasks: any[] = [];

  // WEEK CHART DATA
  weeklyData = [0, 0, 0, 0, 0, 0, 0];

  // SELECTED TASK FOR ROUTE & ASSESSMENT
  selectedTask: any = null;

  // PROFILE POPUP
  showProfile = false;

  openProfile(): void {
    this.showProfile = true;
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initMap(): void {
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded yet');
      return;
    }

    this.map = L.map('volunteer-map', {
      center: [6.9271, 79.8612],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    this.getUserLocation();
    this.loadMapMarkers();
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const youIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="relative w-8 h-8 flex items-center justify-center">
                <span class="absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-40 animate-ping"></span>
                <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([lat, lng], { icon: youIcon })
            .addTo(this.map)
            .bindPopup('<b>Your Current Location</b>')
            .openPopup();

          this.map.setView([lat, lng], 13);
        },
        (error) => {
          console.warn('Error obtaining device location, using default Colombo coordinates:', error);
          const colomboIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="relative w-8 h-8 flex items-center justify-center">
                <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          L.marker([6.9271, 79.8612], { icon: colomboIcon })
            .addTo(this.map)
            .bindPopup('<b>Araksha Center (Colombo)</b>');
        }
      );
    }
  }

  loadMapMarkers(): void {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();

    // 1. Fetch and render Emergency Requests
    this.volunteerhubService.getAllEmergencyRequests().subscribe({
      next: (requests: EmergencyRequest[]) => {
        requests.forEach(req => {
          if (req.status === 'Completed') return;

          const id = 'req-' + req.id;
          const coords = this.getOrCreateCoords(id, req.emergencyType + ' ' + (req.location || ''));
          
          const incidentIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="relative w-8 h-8 flex items-center justify-center">
                <span class="absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-30 animate-ping"></span>
                <div class="relative w-5 h-5 bg-rose-600 border-2 border-rose-200 rounded-full flex items-center justify-center shadow">
                  <span class="text-[9px]">🚨</span>
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([coords.lat, coords.lng], { icon: incidentIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; line-height: 1.4; font-size: 11px;">
              <strong style="color:#e11d48;">🚨 ${req.emergencyType} (${req.priority})</strong><br/>
              <span>📍 ${req.location}</span><br/>
              <span>Citizen: ${req.citizenName}</span><br/>
              <span>Status: <b>${req.status}</b></span>
            </div>
          `);
          this.markersGroup.addLayer(marker);
        });
      },
      error: (err) => console.error('Error fetching requests for map:', err)
    });

    // 2. Fetch and render Shelters
    this.shelterService.getShelters().subscribe({
      next: (shelters) => {
        shelters.forEach(sh => {
          let lat = sh.latitude;
          let lng = sh.longitude;
          
          if (!lat || !lng || lat < 5.0 || lat > 10.0 || lng < 79.0 || lng > 83.0) {
            const id = 'she-' + sh.id;
            const coords = this.getOrCreateCoords(id, sh.name + ' ' + (sh.address || ''));
            lat = coords.lat;
            lng = coords.lng;
          }

          const shelterIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="px-2 py-1 bg-amber-500 border border-amber-300 rounded-lg flex items-center justify-center gap-1 shadow text-[9px] font-bold text-white whitespace-nowrap">
                🏠 <span>${sh.occupied || 0}/${sh.capacity || 100}</span>
              </div>
            `,
            iconSize: [60, 24],
            iconAnchor: [30, 12]
          });

          const marker = L.marker([lat, lng], { icon: shelterIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; line-height: 1.4; font-size: 11px;">
              <strong style="color:#d97706;">🏠 ${sh.name}</strong><br/>
              <span>📍 ${sh.address || 'Relief Center'}</span><br/>
              <span>Capacity: ${sh.occupied || 0}/${sh.capacity || 100}</span>
            </div>
          `);
          this.markersGroup.addLayer(marker);
        });
      },
      error: (err) => console.error('Error fetching shelters for map:', err)
    });
  }

  private getOrCreateCoords(id: string, name: string = ''): { lat: number, lng: number } {
    if (this.coordsMap.has(id)) {
      return this.coordsMap.get(id)!;
    }

    const n = name.toLowerCase();
    let coords = { lat: 0, lng: 0 };

    const regions: { [key: string]: { lat: number, lng: number } } = {
      'colombo': { lat: 6.9271, lng: 79.8612 },
      'kandy': { lat: 7.2906, lng: 80.6337 },
      'galle': { lat: 6.0367, lng: 80.2170 },
      'jaffna': { lat: 9.6615, lng: 80.0144 },
      'gampaha': { lat: 7.0873, lng: 80.0144 },
      'kalutara': { lat: 6.5854, lng: 79.9607 },
      'matara': { lat: 5.9549, lng: 80.5550 },
      'hambantota': { lat: 6.1249, lng: 81.1185 },
      'negombo': { lat: 7.2089, lng: 79.8373 },
      'batticaloa': { lat: 7.7170, lng: 81.7000 },
      'trincomalee': { lat: 8.5873, lng: 81.2152 },
      'anuradhapura': { lat: 8.3114, lng: 80.4037 },
      'polonnaruwa': { lat: 7.9403, lng: 81.0188 },
      'kurunegala': { lat: 7.4863, lng: 80.3623 },
      'puttalam': { lat: 8.0333, lng: 79.8333 },
      'ratnapura': { lat: 6.6828, lng: 80.3992 },
      'kegalle': { lat: 7.2513, lng: 80.3464 },
      'badulla': { lat: 6.9934, lng: 81.0550 },
      'moneragala': { lat: 6.8724, lng: 81.3507 },
      'nuwara eliya': { lat: 6.9497, lng: 80.7891 },
      'matale': { lat: 7.4675, lng: 80.6234 },
      'vavuniya': { lat: 8.7542, lng: 80.4982 },
      'mannar': { lat: 8.9810, lng: 79.9044 },
      'mullaitivu': { lat: 9.2671, lng: 80.8142 },
      'kilinochchi': { lat: 9.3803, lng: 80.3992 },
      'ampara': { lat: 7.2833, lng: 81.6667 }
    };

    const foundRegion = Object.keys(regions).find(region => n.includes(region));

    if (foundRegion) {
      const base = regions[foundRegion];
      coords = {
        lat: base.lat + (Math.random() - 0.5) * 0.05,
        lng: base.lng + (Math.random() - 0.5) * 0.05
      };
    } else {
      coords = {
        lat: 6.9271 + (Math.random() - 0.5) * 0.5,
        lng: 79.8612 + (Math.random() - 0.5) * 0.5
      };
    }

    this.coordsMap.set(id, coords);
    return coords;
  }

  loadDashboard(): void {
    const storedEmail = localStorage.getItem('email');
    const email = storedEmail ? storedEmail : 'volunteer@araksha.com';
    this.volunteerhubService.getVolunteerByEmail(email).subscribe({
      next: (res: any) => {
        this.volunteerDetails = res;
        this.volunteer = {
          name: res.name,
          volunteerCode: res.volunteerCode,
          status: res.status
        };
        this.loadTasks(res.id);
        this.loadOpenRequests();
      },
      error: (err: any) => {
        console.error('Error fetching volunteer details:', err);
        // Fallback so page loads even on service network error
        const fallbackVol = {
          id: 1,
          name: 'Volunteer User',
          volunteerCode: 'VOL-0001',
          status: 'Active',
          available: true,
          email: email,
          phone: '+94 77 123 4567'
        };
        this.volunteerDetails = fallbackVol;
        this.volunteer = {
          name: fallbackVol.name,
          volunteerCode: fallbackVol.volunteerCode,
          status: fallbackVol.status
        };
        this.loadTasks(fallbackVol.id);
        this.loadOpenRequests();
      }
    });
  }

  loadTasks(volunteerId: number): void {
    this.volunteerhubService.getAllEmergencyRequests().subscribe({
      next: (requests: EmergencyRequest[]) => {
        const volunteerName = this.volunteer.name;
        const volunteerCode = this.volunteer.volunteerCode;
        const myRequests = requests.filter(r => 
          (r.assignedVolunteer && r.assignedVolunteer.trim() !== '' && 
           (r.assignedVolunteer === volunteerName || r.assignedVolunteer === volunteerCode))
        );

        const active = myRequests.filter(r => r.status !== 'Completed');
        const completed = myRequests.filter(r => r.status === 'Completed');

        this.tasks = active.map(r => ({
          id: r.id,
          taskCode: r.requestId,
          name: (r.emergencyType || 'General') + ' Rescue',
          location: r.location,
          distance: (1.0 + Math.random() * 2.0).toFixed(1) + ' mi',
          eta: Math.floor(5 + Math.random() * 15) + ' min',
          priority: r.priority || 'Medium',
          priorityColor: this.getPriorityColor(r.priority),
          active: true,
          citizenName: r.citizenName || 'Unknown Citizen',
          contact: '+94 77 123 4567',
          rawRequest: r
        }));

        this.completedTasks = completed.map(r => ({
          id: r.requestId,
          type: (r.emergencyType || 'General').replace(' Emergency', '').replace(' Rescue', ''),
          date: r.requestTime ? r.requestTime.split('T')[0] : new Date().toISOString().split('T')[0],
          stars: 5
        }));

        if (this.tasks.length > 0) {
          if (!this.selectedTask || !this.tasks.some(t => t.id === this.selectedTask.id)) {
            this.selectTask(this.tasks[0]);
          }
        } else {
          this.selectedTask = null;
        }

        this.stats[0].value = completed.length.toString();
        this.stats[1].value = active.length.toString();
        this.stats[2].value = '5.0';
        this.stats[3].value = (completed.length * 150).toLocaleString();

        this.weeklyData = [
          Math.max(0, completed.length - 2),
          Math.max(0, completed.length - 1),
          completed.length,
          Math.max(0, completed.length - 3),
          Math.max(0, completed.length - 2),
          Math.max(0, completed.length - 1),
          completed.length
        ];
      },
      error: (err: any) => {
        console.error('Error fetching emergency requests:', err);
      }
    });
  }

  loadOpenRequests(): void {
    this.volunteerhubService.getAllEmergencyRequests().subscribe({
      next: (res: EmergencyRequest[]) => {
        const open = res.filter(r => 
          r.status === 'Pending' && 
          (!r.assignedVolunteer || r.assignedVolunteer.trim() === '')
        );

        this.openRequests = open.map(r => ({
          id: r.id,
          requestCode: r.requestId,
          priority: r.priority || 'Medium',
          priorityClass: this.getPriorityClass(r.priority),
          description: `${r.emergencyType || 'General'} assistance requested at ${r.location}.`,
          distance: (1.5 + Math.random() * 4.0).toFixed(1) + ' mi away',
          rawRequest: r
        }));
      },
      error: (err: any) => {
        console.error('Error fetching open emergency requests:', err);
      }
    });
  }

  selectTask(task: any): void {
    this.selectedTask = task;
    if (task.name.toLowerCase().includes('flood')) {
      this.needs = ['Water Rescue', 'Food Supplies', 'Blankets', 'Life Jackets'];
    } else if (task.name.toLowerCase().includes('fire')) {
      this.needs = ['Fire Extinguisher', 'First Aid', 'Oxygen Mask', 'Blankets'];
    } else if (task.name.toLowerCase().includes('medical')) {
      this.needs = ['First Aid Kit', 'Stretchers', 'Emergency Meds'];
    } else {
      this.needs = ['Water Rescue', 'Food', 'Blankets'];
    }

    if (this.map && task.rawRequest) {
      const id = 'req-' + task.rawRequest.id;
      const coords = this.getOrCreateCoords(id, task.rawRequest.emergencyType + ' ' + (task.rawRequest.location || ''));
      this.map.setView([coords.lat, coords.lng], 14, { animate: true });
    }
  }

  acceptRequest(request: any): void {
    if (!this.volunteerDetails) return;

    const rawReq = request.rawRequest;
    const updatedReq: EmergencyRequest = {
      ...rawReq,
      status: 'Assigned',
      assignedVolunteer: this.volunteer.name
    };

    this.volunteerhubService.updateEmergencyRequest(rawReq.id, updatedReq).subscribe({
      next: () => {
        console.log('Task successfully accepted.');
        this.loadDashboard();
        this.loadMapMarkers();
      },
      error: (err: any) => {
        console.error('Error accepting request:', err);
      }
    });
  }

  completeTask(taskId: number): void {
    const matchedTask = this.tasks.find(t => t.id === taskId);
    if (!matchedTask) return;
    const rawReq = matchedTask.rawRequest;

    const updatedReq: EmergencyRequest = {
      ...rawReq,
      status: 'Completed'
    };

    this.volunteerhubService.updateEmergencyRequest(rawReq.id, updatedReq).subscribe({
      next: () => {
        console.log('Task completed.');
        this.loadDashboard();
        this.loadMapMarkers();
      },
      error: (err: any) => {
        console.error('Error completing task:', err);
      }
    });
  }

  private getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-500';
      case 'high': return 'bg-orange-100 text-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-blue-100 text-blue-500';
    }
  }

  private getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-orange-500 border border-orange-200 bg-orange-50/30';
      case 'medium':
        return 'text-yellow-600 border border-yellow-200 bg-yellow-50/30';
      default:
        return 'text-blue-500 border border-blue-200 bg-blue-50/30';
    }
  }
}
