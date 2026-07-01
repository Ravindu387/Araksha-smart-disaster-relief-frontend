import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { ShelterService } from '../../../../services/shelter';
import { InventoryService } from '../../../../Common/services/inventory.service';
import { AllocationService, RecentAllocation } from '../../../../Common/services/allocation.service';
import { forkJoin, catchError, of } from 'rxjs';

declare const L: any;

interface Emergency {
  id: string;
  title: string;
  location: string;
  priority: string;
  resources: string[];
  status: string;
  lat?: number;
  lng?: number;
}

interface Volunteer {
  id?: number;
  name: string;
  skill: string;
  distance: string;
  eta: string;
  isBest?: boolean;
  matchScore?: number;
  lat?: number;
  lng?: number;
}

interface Shelter {
  id: number;
  name: string;
  distance: string;
  bedsFree: number;
  lat?: number;
  lng?: number;
}

interface ResourceItem {
  id: number;
  label: string;
  count: string;
}

@Component({
  selector: 'app-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './allocation.html',
  styleUrls: ['./allocation.css']
})
export class AllocationComponent implements OnInit, AfterViewInit {

  selectedEmergencyId = '';
  assigned = false;
  matching = false;
  assignSuccess = '';

  emergencies: Emergency[] = [];
  volunteers: Volunteer[] = [];
  shelters: Shelter[] = [];
  resources: ResourceItem[] = [];
  recentAllocations: RecentAllocation[] = [];

  private originalEmergencies: any[] = [];
  private originalVolunteers: any[] = [];
  private originalShelters: any[] = [];
  private originalInventory: any[] = [];

  private map: any;
  private markersGroup: any;
  private coordsMap = new Map<string, { lat: number, lng: number }>();

  constructor(
    private emergencyService: EmergencyRequestService,
    private volunteerService: VolunteerService,
    private shelterService: ShelterService,
    private inventoryService: InventoryService,
    private allocationService: AllocationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  loadAllData(): void {
    forkJoin({
      emergencies: this.emergencyService.getAllRequests().pipe(catchError(err => { console.error('Emergencies error', err); return of([]); })),
      volunteers: this.volunteerService.getAllVolunteers().pipe(catchError(err => { console.error('Volunteers error', err); return of([]); })),
      shelters: this.shelterService.getShelters().pipe(catchError(err => { console.error('Shelters error', err); return of([]); })),
      inventory: this.inventoryService.getAllInventory().pipe(catchError(err => { console.error('Inventory error', err); return of([]); })),
      allocations: this.allocationService.getAllAllocations().pipe(catchError(err => { console.error('Allocations error', err); return of([]); }))
    }).subscribe({
      next: (res) => {
        this.originalEmergencies = res.emergencies;
        this.originalVolunteers = res.volunteers;
        this.originalShelters = res.shelters;
        this.originalInventory = res.inventory;

        // 1. Map Emergencies
        this.emergencies = res.emergencies.map((req: any) => {
          let status = 'Awaiting Assignment';
          if (req.status === 'Completed' || req.status === 'Resolved' || req.status === 'Assigned' || req.assignedVolunteer) {
            status = 'Assigned';
          }
          
          // Connect database needs (resources list) to emergency
          let resources = (req.resources || []).length > 0 ? req.resources : ['Supplies', 'Food Kits'];
          if ((req.resources || []).length === 0) {
            const type = (req.emergencyType || '').toLowerCase();
            if (type.includes('flood')) {
              resources = ['Water Rescue', 'Food Kits', 'Blankets'];
            } else if (type.includes('earthquake')) {
              resources = ['Medical', 'Search & Rescue'];
            } else if (type.includes('hurricane')) {
              resources = ['Evacuation', 'Tents', 'Food Kits'];
            }
          }

          const coords = this.getOrCreateCoords(req.requestId || `ER-${req.id}`, req.emergencyType + ' ' + (req.location || ''));

          return {
            id: req.requestId || `ER-${req.id.toString().padStart(4, '0')}`,
            title: `${req.emergencyType || 'General'} Emergency`,
            location: req.location || 'Unknown Location',
            priority: req.priority || 'Medium',
            resources,
            status,
            lat: coords.lat,
            lng: coords.lng
          };
        });

        // Auto-select first emergency if none selected
        if (this.emergencies.length > 0 && !this.selectedEmergencyId) {
          this.selectedEmergencyId = this.emergencies[0].id;
        }

        // 2. Map Volunteers
        this.volunteers = res.volunteers.map((v: any) => {
          const coords = this.getOrCreateCoords('vol-' + v.id, v.name + ' ' + (v.location || ''));
          return {
            id: v.id,
            name: v.name,
            skill: (v.skills || []).join(' · ') || 'General Relief',
            distance: '2.5 mi',
            eta: 'ETA 10 min',
            isBest: v.rating >= 4.8,
            lat: coords.lat,
            lng: coords.lng
          };
        });

        // 3. Map Shelters
        this.shelters = res.shelters.map((s: any) => {
          let lat = s.latitude;
          let lng = s.longitude;
          if (!lat || !lng || lat < 5.0 || lat > 10.0 || lng < 79.0 || lng > 83.0) {
            const coords = this.getOrCreateCoords('she-' + s.id, s.name + ' ' + (s.address || ''));
            lat = coords.lat;
            lng = coords.lng;
          } else {
            this.coordsMap.set('she-' + s.id, { lat, lng });
          }
          return {
            id: s.id,
            name: s.name,
            distance: '1.5 mi',
            bedsFree: s.capacity - s.occupied,
            lat,
            lng
          };
        });

        // 4. Map Inventory Resources
        this.resources = res.inventory.map((item: any) => ({
          id: item.id,
          label: `${item.name} (${item.unit})`,
          count: item.count.toLocaleString()
        }));

        // 5. Map Recent Allocations
        this.recentAllocations = [...res.allocations].reverse();

        // Render Map markers
        this.renderMapMarkers();

        // Force Angular change detection
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching allocation dashboard data:', err)
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
      'gampaha': { lat: 7.0873, lng: 80.0164 },
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

    this.map = L.map('allocationMap', {
      center: [7.8731, 80.7718], 
      zoom: 7.5,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    this.renderMapMarkers();
  }

  private renderMapMarkers() {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();

    // 1. Render Emergencies (Red circles)
    this.emergencies.forEach(e => {
      if (e.status !== 'Awaiting Assignment' && e.status !== 'Pending') return;
      if (!e.lat || !e.lng) return;

      const priorityPulse = e.priority === 'Critical' ? 'animate-ping' : '';
      const emergencyIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-30 ${priorityPulse}"></span>
            <div class="relative w-5 h-5 bg-rose-600 border-2 border-rose-200 rounded-full flex items-center justify-center shadow">
              <span class="text-[9px]">🚨</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([e.lat, e.lng], { icon: emergencyIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Emergency</span>
            <span style="font-size: 9px; font-weight: bold; color: #ef4444;">${e.priority}</span>
          </div>
          <h4 style="margin: 4px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${e.title}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">📍 ${e.location}</p>
          <div style="font-size: 10px; color: #64748b;">Status: <b>${e.status}</b></div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectEmergency(e.id);
        this.cdr.detectChanges();
      });
      this.markersGroup.addLayer(marker);
    });

    // 2. Render Volunteers (Blue circles)
    this.volunteers.forEach(vol => {
      if (!vol.lat || !vol.lng) return;

      const volunteerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <div class="relative w-6 h-6 bg-blue-500 border border-blue-200 rounded-full flex items-center justify-center shadow text-xs">
              🏃
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([vol.lat, vol.lng], { icon: volunteerIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2);">Volunteer</span>
          <h4 style="margin: 6px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${vol.name}</h4>
          <p style="margin: 0 0 2px 0; font-size: 11px; color: #64748b;"><b>Skill:</b> ${vol.skill}</p>
          <p style="margin: 0; font-size: 11px; color: #64748b;"><b>Distance:</b> ${vol.distance}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);
      
      this.markersGroup.addLayer(marker);
    });

    // 3. Render Shelters (Green circle icon badges)
    this.shelters.forEach(sh => {
      if (!sh.lat || !sh.lng) return;

      const shelterIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="px-2 py-0.5 bg-emerald-500 border border-emerald-300 rounded-lg flex items-center justify-center gap-1 shadow text-[9px] font-bold text-white whitespace-nowrap">
            🏠 <span>${sh.bedsFree} free</span>
          </div>
        `,
        iconSize: [60, 20],
        iconAnchor: [30, 10]
      });

      const marker = L.marker([sh.lat, sh.lng], { icon: shelterIcon });
      
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 180px;">
          <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);">Shelter</span>
          <h4 style="margin: 6px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${sh.name}</h4>
          <p style="margin: 0; font-size: 11px; color: #64748b;"><b>Beds Free:</b> ${sh.bedsFree}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);
      
      this.markersGroup.addLayer(marker);
    });
  }

  get selectedEmergency(): Emergency | undefined {
    return this.emergencies.find(e => e.id === this.selectedEmergencyId);
  }

  get recommendedVolunteers(): Volunteer[] {
    const emergency = this.selectedEmergency;
    if (!emergency) return this.volunteers;

    return this.volunteers
      .map(v => {
        let score = 0;
        const volunteerSkills = v.skill.toLowerCase();

        emergency.resources.forEach(resName => {
          const reqRes = resName.toLowerCase();
          if (volunteerSkills.includes(reqRes) || reqRes.includes(volunteerSkills)) {
            score += 10;
          }
          if (reqRes.includes('medical') && (volunteerSkills.includes('medical') || volunteerSkills.includes('first aid'))) {
            score += 8;
          }
          if (reqRes.includes('rescue') && volunteerSkills.includes('rescue')) {
            score += 8;
          }
          if (reqRes.includes('food') || reqRes.includes('supplies') || reqRes.includes('blanket')) {
            if (volunteerSkills.includes('logistics')) {
              score += 5;
            }
          }
        });

        if (v.isBest) {
          score += 2;
        }

        return { ...v, matchScore: score };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .map((v, index) => ({
        ...v,
        // Mark top 2 highest matches with positive score as 'Best'
        isBest: (v.matchScore || 0) > 0 && index < 2
      }));
  }

  get awaitingAssignmentCount(): number {
    return this.emergencies.filter(e => e.status === 'Awaiting Assignment').length;
  }

  selectEmergency(id: string): void {
    this.selectedEmergencyId = id;
    this.assignSuccess = '';
    this.assigned = false;
  }

  autoAssign(): void {
    const unassigned = this.originalEmergencies.filter(
      (e: any) => e.status !== 'Completed' && e.status !== 'Resolved' && e.status !== 'Assigned' && !e.assignedVolunteer
    );

    if (unassigned.length === 0) {
      this.assignSuccess = 'No pending emergencies to assign!';
      setTimeout(() => { this.assignSuccess = ''; }, 3000);
      return;
    }

    this.matching = true;
    
    // Assign available volunteers to each emergency request
    const updateObservables = unassigned.map((e: any, index: number) => {
      const vol = this.originalVolunteers[index % this.originalVolunteers.length];
      e.status = 'Assigned';
      if (vol) {
        e.assignedVolunteer = vol.name;
      }
      return this.emergencyService.updateRequest(e.id, e);
    });

    forkJoin(updateObservables).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: 'Auto-Assign completed: all pending emergencies allocated',
          time: this.getCurrentTimeString(),
          type: 'info'
        }).subscribe({
          next: () => {
            this.matching = false;
            this.assignSuccess = 'All pending emergencies auto-assigned successfully!';
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => {
        console.error(err);
        this.matching = false;
      }
    });
  }

  smartMatch(): void {
    const emergency = this.selectedEmergency;
    const original = this.originalEmergencies.find(
      x => (x.requestId || `ER-${x.id.toString().padStart(4, '0')}`) === this.selectedEmergencyId
    );

    if (!emergency || !original) return;

    this.matching = true;
    setTimeout(() => {
      // Find the best volunteer based on rating or skills matching
      const recommended = this.recommendedVolunteers;
      const bestVol = recommended.length > 0 ? recommended[0] : null;

      const volunteerName = bestVol ? bestVol.name : 'Lisa Chen';
      original.status = 'Assigned';
      original.assignedVolunteer = volunteerName;

      this.emergencyService.updateRequest(original.id, original).subscribe({
        next: () => {
          this.allocationService.createAllocation({
            message: `AI recommended ${volunteerName} assigned to ${emergency.id}`,
            time: this.getCurrentTimeString(),
            type: 'volunteer'
          }).subscribe({
            next: () => {
              this.matching = false;
              this.assignSuccess = `AI Smart Matching complete — ${volunteerName} recommended & assigned!`;
              this.loadAllData();
              setTimeout(() => { this.assignSuccess = ''; }, 4000);
            }
          });
        },
        error: (err: any) => {
          console.error(err);
          this.matching = false;
        }
      });
    }, 1500);
  }

  assignVolunteer(v: Volunteer): void {
    const emergency = this.selectedEmergency;
    const original = this.originalEmergencies.find(
      x => (x.requestId || `ER-${x.id.toString().padStart(4, '0')}`) === this.selectedEmergencyId
    );

    if (!emergency || !original) return;

    original.status = 'Assigned';
    original.assignedVolunteer = v.name;

    this.emergencyService.updateRequest(original.id, original).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${v.name} assigned to ${emergency.id} (${emergency.title})`,
          time: this.getCurrentTimeString(),
          type: 'volunteer'
        }).subscribe({
          next: () => {
            this.assignSuccess = `${v.name} has been successfully assigned to ${emergency.title} (${emergency.id})!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error assigning volunteer:', err)
    });
  }

  assignShelter(s: Shelter): void {
    const emergency = this.selectedEmergency;
    const originalShelter = this.originalShelters.find(x => x.id === s.id);

    if (!emergency || !originalShelter) return;

    if (originalShelter.occupied >= originalShelter.capacity) {
      alert('This shelter is already full!');
      return;
    }

    // Increment occupied beds in the database
    originalShelter.occupied++;

    this.shelterService.update(originalShelter.id, originalShelter).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${s.name} linked to response for ${emergency.id}`,
          time: this.getCurrentTimeString(),
          type: 'shelter'
        }).subscribe({
          next: () => {
            this.assignSuccess = `${s.name} linked as active relief shelter for ${emergency.title}!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error linking shelter:', err)
    });
  }

  dispatchResource(item: ResourceItem): void {
    const emergency = this.selectedEmergency;
    const originalItem = this.originalInventory.find(x => x.id === item.id);

    if (!emergency || !originalItem) return;

    const dispatchAmt = originalItem.count > 500 ? 200 : 50;
    if (originalItem.count < dispatchAmt) {
      alert('Insufficient stock to dispatch!');
      return;
    }

    // Decrement count and increment allocated
    originalItem.count -= dispatchAmt;
    originalItem.allocated += dispatchAmt;

    this.inventoryService.updateInventory(originalItem.id, originalItem).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${originalItem.name} (${dispatchAmt} units) dispatched to ${emergency.id}`,
          time: this.getCurrentTimeString(),
          type: 'resource'
        }).subscribe({
          next: () => {
            this.assignSuccess = `Dispatched ${dispatchAmt} units of ${originalItem.name} to ${emergency.title}!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error dispatching resource:', err)
    });
  }

  getCurrentTimeString(): string {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      Critical: 'bg-red-50 text-red-600 border border-red-100',
      High:     'bg-amber-50 text-amber-600 border border-amber-100',
      Medium:   'bg-yellow-50 text-yellow-700 border border-yellow-100',
    };
    return map[priority] ?? 'bg-gray-50 text-gray-600 border border-gray-100';
  }
}