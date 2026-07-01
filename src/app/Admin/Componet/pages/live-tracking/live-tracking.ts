import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { ShelterService } from '../../../../services/shelter';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { NotificationService } from '../../../../Common/services/notification.service';
import { forkJoin, catchError, of } from 'rxjs';

declare const L: any;

@Component({
  selector: 'app-live-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-tracking.html',
  styleUrl: './live-tracking.css',
})
export class LiveTracking implements OnInit, OnDestroy, AfterViewInit {
  isLive = true;
  systemTime = '';
  searchQuery = '';
  currentTab = 'All';
  selectedMarker: any = null;
  focusedMarkerId: string | null = null;
  showBroadcastForm = false;

  newIncidentTitle = '';
  newIncidentSeverity = 'Critical';
  newIncidentLocation = '';
  newIncidentDetails = '';

  private timerId: any;
  private simIntervalId: any;
  private dataIntervalId: any;

  incidents: any[] = [];
  volunteers: any[] = [];
  shelters: any[] = [];

  private map: any;
  private markersGroup: any;

  private readonly volunteerService = inject(VolunteerService);
  private readonly shelterService = inject(ShelterService);
  private readonly emergencyRequestService = inject(EmergencyRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  private coordsMap = new Map<string, { lat: number, lng: number }>();

  ngOnInit() {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 1000);
    this.loadAllData();
    this.dataIntervalId = setInterval(() => this.loadAllData(), 5000);
    this.startSimulation();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
    if (this.dataIntervalId) clearInterval(this.dataIntervalId);
    this.stopSimulation();
  }

  private updateTime() {
    const now = new Date();
    this.systemTime = now.toLocaleTimeString();
  }

  toggleLive() {
    this.isLive = !this.isLive;
    if (this.isLive) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
  }

  private startSimulation() {
    this.stopSimulation();
    this.simIntervalId = setInterval(() => {
      this.updateSimulation();
    }, 2000);
  }

  private stopSimulation() {
    if (this.simIntervalId) {
      clearInterval(this.simIntervalId);
    }
  }

  private updateSimulation() {
    this.volunteers = this.volunteers.map(v => {
      let dLat = (Math.random() - 0.5) * 0.002;
      let dLng = (Math.random() - 0.5) * 0.002;

      if (v.targetIncidentId) {
        const target = this.incidents.find(i => i.id === v.targetIncidentId);
        if (target && target.status === 'Active') {
          dLat = (target.lat - v.lat) * 0.1 + (Math.random() - 0.5) * 0.0005;
          dLng = (target.lng - v.lng) * 0.1 + (Math.random() - 0.5) * 0.0005;
        }
      }

      const newLat = Math.max(5.9, Math.min(9.9, v.lat + dLat));
      const newLng = Math.max(79.5, Math.min(82.0, v.lng + dLng));

      this.coordsMap.set(v.id, { lat: newLat, lng: newLng });

      return { ...v, lat: newLat, lng: newLng };
    });

    this.renderMapMarkers();
  }

  loadAllData() {
    forkJoin({
      requests: this.emergencyRequestService.getAllRequests().pipe(catchError(err => { console.error(err); return of([]); })),
      vols: this.volunteerService.getAllVolunteers().pipe(catchError(err => { console.error(err); return of([]); })),
      shelters: this.shelterService.getShelters().pipe(catchError(err => { console.error(err); return of([]); }))
    }).subscribe({
      next: (res) => {
        this.incidents = res.requests.map((req: any) => {
          const id = 'inc-' + req.id;
          const coords = this.getOrCreateCoords(id, req.emergencyType + ' ' + (req.location || ''));
          return {
            id: id,
            title: req.emergencyType || 'Incident',
            location: req.location || 'Unknown location',
            severity: req.priority || 'Critical',
            lat: coords.lat,
            lng: coords.lng,
            time: 'Just now',
            status: req.status === 'Completed' ? 'Resolved' : 'Active',
            details: 'Citizen: ' + req.citizenName + '. Assigned Volunteer: ' + (req.assignedVolunteer || 'None')
          };
        });

        this.volunteers = res.vols.map((v: any) => {
          const id = 'vol-' + v.id;
          const coords = this.getOrCreateCoords(id, v.name + ' ' + (v.location || ''));
          return {
            id: id,
            name: v.name,
            role: v.skills && v.skills.length ? v.skills[0] : 'General Responder',
            lat: coords.lat,
            lng: coords.lng,
            status: v.status || 'Active',
            targetIncidentId: '', 
            phone: v.phone || '+94 77 000 0000',
            team: v.location || 'Sector A'
          };
        });

        this.shelters = res.shelters.map((s: any) => {
          const id = 'she-' + s.id;
          
          let lat = s.latitude;
          let lng = s.longitude;
          
          if (!lat || !lng || lat < 5.0 || lat > 10.0 || lng < 79.0 || lng > 83.0) {
            const coords = this.getOrCreateCoords(id, s.name + ' ' + (s.address || ''));
            lat = coords.lat;
            lng = coords.lng;
          } else {
            this.coordsMap.set(id, { lat, lng });
          }

          return {
            id: id,
            name: s.name,
            location: s.address || s.city || 'Relief Center',
            occupancy: s.occupied || 0,
            capacity: s.capacity || 100,
            lat: lat,
            lng: lng,
            status: s.status || 'Active',
            manager: 'Staff'
          };
        });

        this.renderMapMarkers();

        if (this.selectedMarker) {
          const updated = this.findMarkerById(this.selectedMarker.id.replace(/^[a-z]+-/, ''), this.selectedMarker.markerType);
          if (updated) {
            this.selectedMarker = { ...updated, markerType: this.selectedMarker.markerType };
          }
        }
      },
      error: (err) => console.error('Failed to load tracking data from backend:', err)
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
        lat: 6.0 + Math.random() * 3.5, 
        lng: 79.8 + Math.random() * 1.8 
      };
    }

    this.coordsMap.set(id, coords);
    return coords;
  }

  private initMap() {
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded yet');
      return;
    }

    this.map = L.map('map', {
      center: [7.8731, 80.7718], 
      zoom: 8,
      zoomControl: false 
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    this.renderMapMarkers();
  }

  private renderMapMarkers() {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();

    // 1. Render Incident markers (Red Circles)
    this.incidents.forEach(inc => {
      if (inc.status !== 'Active') return; 

      const pulseClass = this.focusedMarkerId === inc.id ? 'border-2 border-cyan-500 animate-pulse' : '';
      const incidentIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center ${pulseClass}">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-30 animate-ping"></span>
            <div class="relative w-5 h-5 bg-rose-600 border-2 border-rose-200 rounded-full flex items-center justify-center shadow">
              <span class="text-[9px]">🚨</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: incidentIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Incident</span>
            <span style="font-size: 9px; font-weight: bold; color: #ef4444;">${inc.severity}</span>
          </div>
          <h4 style="margin: 4px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${inc.title}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">📍 ${inc.location}</p>
          <div style="font-size: 10px; color: #475569; background: #f8fafc; padding: 4px; border-radius: 6px; border: 1px solid #f1f5f9;">${inc.details}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectMarker(inc, 'Incident');
        this.cdr.detectChanges();
      });
      this.markersGroup.addLayer(marker);
    });

    // 2. Render Volunteer markers (Cyan Circles)
    this.volunteers.forEach(vol => {
      const pulseClass = this.focusedMarkerId === vol.id ? 'border-2 border-cyan-500 animate-pulse' : '';
      const volunteerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center ${pulseClass}">
            <div class="relative w-7 h-7 bg-cyan-600 border-2 border-cyan-200 rounded-full flex items-center justify-center shadow text-xs">
              🏃
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([vol.lat, vol.lng], { icon: volunteerIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(6, 182, 212, 0.1); color: #0891b2; border: 1px solid rgba(6, 182, 212, 0.2);">Volunteer</span>
          <h4 style="margin: 6px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${vol.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">Specialty: ${vol.role}</p>
          <p style="margin: 0; font-size: 10px; color: #64748b;">📞 ${vol.phone}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectMarker(vol, 'Volunteer');
        this.cdr.detectChanges();
      });
      this.markersGroup.addLayer(marker);
    });

    // 3. Render Shelter markers (Amber Badges)
    this.shelters.forEach(sh => {
      const pulseClass = this.focusedMarkerId === sh.id ? 'border-2 border-cyan-500 animate-pulse' : '';
      const shelterIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="px-2 py-1 bg-amber-500 border border-amber-300 rounded-lg flex items-center justify-center gap-1 shadow text-[9px] font-bold text-white whitespace-nowrap ${pulseClass}">
            🏠 <span>${sh.occupancy}/${sh.capacity}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const marker = L.marker([sh.lat, sh.lng], { icon: shelterIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2);">Shelter</span>
          <h4 style="margin: 6px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${sh.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">📍 ${sh.location}</p>
          <div style="font-size: 11px; font-weight: 600; color: #1e293b;">Occupancy: ${sh.occupancy} / ${sh.capacity} (${Math.round((sh.occupancy/sh.capacity)*100)}%)</div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectMarker(sh, 'Shelter');
        this.cdr.detectChanges();
      });
      this.markersGroup.addLayer(marker);
    });
  }

  selectMarker(marker: any, type: string) {
    this.selectedMarker = { ...marker, markerType: type };
  }

  clearSelection() {
    this.selectedMarker = null;
  }

  locateMarker(id: string, type: string) {
    this.focusedMarkerId = id;
    const found = this.findMarkerById(id, type);
    if (found) {
      this.selectedMarker = { ...found, markerType: type };
      if (this.map && found.lat && found.lng) {
        this.map.setView([found.lat, found.lng], 12, { animate: true });
      }
    }
    setTimeout(() => {
      this.focusedMarkerId = null;
    }, 3000);
  }

  private findMarkerById(id: string, type: string) {
    if (type === 'Incident') return this.incidents.find(i => i.id === id || i.id === 'inc-' + id);
    if (type === 'Volunteer') return this.volunteers.find(v => v.id === id || v.id === 'vol-' + id);
    if (type === 'Shelter') return this.shelters.find(s => s.id === id || s.id === 'she-' + id);
    return null;
  }

  get filteredItems() {
    const q = this.searchQuery.toLowerCase().trim();
    const list: any[] = [];

    if (this.currentTab === 'All' || this.currentTab === 'Emergencies') {
      this.incidents.forEach(i => {
        if (i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)) {
          list.push({ ...i, type: 'Incident' });
        }
      });
    }

    if (this.currentTab === 'All' || this.currentTab === 'Volunteers') {
      this.volunteers.forEach(v => {
        if (v.name.toLowerCase().includes(q) || v.role.toLowerCase().includes(q)) {
          list.push({ ...v, type: 'Volunteer' });
        }
      });
    }

    if (this.currentTab === 'All' || this.currentTab === 'Shelters') {
      this.shelters.forEach(s => {
        if (s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)) {
          list.push({ ...s, type: 'Shelter' });
        }
      });
    }

    return list;
  }

  submitBroadcast() {
    if (!this.newIncidentTitle || !this.newIncidentLocation) {
      alert('Please fill out Title and Location');
      return;
    }

    const body: any = {
      requestId: 'REQ' + Math.floor(100000 + Math.random() * 900000),
      citizenName: 'Operations Center',
      emergencyType: this.newIncidentTitle,
      priority: this.newIncidentSeverity,
      status: 'Pending',
      location: this.newIncidentLocation
    };

    this.emergencyRequestService.addRequest(body).subscribe({
      next: (savedReq) => {
        const markerId = 'inc-' + savedReq.id;
        this.getOrCreateCoords(markerId, savedReq.emergencyType + ' ' + savedReq.location);
        this.loadAllData();

        // Broadcast system notification alert
        const notificationPayload = {
          category: 'alerts',
          severity: this.newIncidentSeverity.toLowerCase() === 'critical' ? 'critical' : (this.newIncidentSeverity.toLowerCase() === 'low' ? 'info' : 'high'),
          title: `New Incident Alert: ${savedReq.emergencyType}`,
          badge: savedReq.priority,
          description: this.newIncidentDetails || `A critical emergency request has been reported at ${savedReq.location}.`,
          time: 'Just now',
          read: false
        };
        this.notificationService.addNotification(notificationPayload).subscribe({
          error: (err) => console.error('Failed to create notification', err)
        });

        this.newIncidentTitle = '';
        this.newIncidentLocation = '';
        this.newIncidentDetails = '';
        this.showBroadcastForm = false;

        setTimeout(() => {
          const standbyVol = this.volunteers.find(v => !v.targetIncidentId);
          if (standbyVol) {
            standbyVol.targetIncidentId = markerId;
          }
          this.locateMarker(markerId, 'Incident');
        }, 300);
      },
      error: (err) => {
        console.error(err);
        alert('Failed to publish incident to the backend.');
      }
    });
  }
}
