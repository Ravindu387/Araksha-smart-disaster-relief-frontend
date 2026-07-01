import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shelter } from '../../../../Common/models/shelter.model';
import { ShelterService } from '../../../../services/shelter';

declare const L: any;

type FilterType = 'All' | 'Available' | 'Limited' | 'Full';

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shelters.html'
})
export class SheltersComponent implements OnInit, AfterViewInit {

  shelters: Shelter[] = [];

  searchQuery = '';
  activeFilter: FilterType = 'All';

  registerModalOpen = false;
  newShelterName = '';
  newShelterAddress = '';
  newShelterCapacity: number | null = null;
  newShelterOccupied: number | null = null;
  newShelterAmenities = '';
  newShelterLatitude: number | null = null;
  newShelterLongitude: number | null = null;
  newShelterRegion = 'Colombo';
  sriLankaRegions = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Gampaha', 'Kalutara', 'Matara', 'Hambantota',
    'Negombo', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Kurunegala',
    'Puttalam', 'Ratnapura', 'Kegalle', 'Badulla', 'Moneragala', 'Nuwara Eliya', 'Matale',
    'Vavuniya', 'Mannar', 'Mullaitivu', 'Kilinochchi', 'Ampara'
  ];

  private map: any;
  private markersGroup: any;

  constructor(private shelterService: ShelterService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  loadShelters(): void {
    this.shelterService.getAll().subscribe({
      next: (data) => {
        this.shelters = data;
        this.renderMapMarkers();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Failed to load shelters', err)
    });
  }

  get totalCapacity(): number {
    return this.shelters.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
  }

  get totalOccupied(): number {
    return this.shelters.reduce((sum, s) => sum + (s.occupied ?? 0), 0);
  }

  get availableBeds(): number {
    return this.totalCapacity - this.totalOccupied;
  }

  get filteredShelters(): Shelter[] {
    return this.shelters.filter(s => {
      const matchesFilter = this.activeFilter === 'All' || s.status === this.activeFilter;
      const q = this.searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }

  getOccupancyPercent(shelter: Shelter): number {
    if (!shelter.capacity) return 0;
    return Math.min(100, Math.round((shelter.occupied / shelter.capacity) * 100));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Limited': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Full': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  getBarColor(status: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-500';
      case 'Limited': return 'bg-amber-500';
      case 'Full': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }

  openRegisterModal(): void {
    this.registerModalOpen = true;
  }

  closeRegisterModal(): void {
    this.registerModalOpen = false;
    this.resetForm();
  }

  registerShelterSubmit(): void {
    if (!this.newShelterName || !this.newShelterAddress || !this.newShelterCapacity) {
      return;
    }

    const amenitiesArray = this.newShelterAmenities
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    let lat = 6.9271;
    let lng = 79.8612;

    // Detect from manually entered coords or parse address / dropdown
    if (this.newShelterLatitude && this.newShelterLongitude) {
      lat = this.newShelterLatitude;
      lng = this.newShelterLongitude;
    } else {
      const resolvedFromAddress = this.getCoordsFromAddress(this.newShelterAddress);
      if (resolvedFromAddress.lat === 6.9271 && resolvedFromAddress.lng === 79.8612) {
        const resolvedFromDropdown = this.getCoordsFromAddress(this.newShelterRegion);
        lat = resolvedFromDropdown.lat;
        lng = resolvedFromDropdown.lng;
      } else {
        lat = resolvedFromAddress.lat;
        lng = resolvedFromAddress.lng;
      }
    }

    const payload: Partial<Shelter> = {
      name: this.newShelterName,
      address: this.newShelterAddress,
      capacity: this.newShelterCapacity,
      occupied: this.newShelterOccupied ?? 0,
      amenities: amenitiesArray,
      latitude: lat,
      longitude: lng
    };

    this.shelterService.create(payload).subscribe({
      next: (created) => {
        this.shelters = [...this.shelters, created];
        this.renderMapMarkers();
        
        // Pan the map to show the newly added shelter location immediately
        if (this.map) {
          this.map.setView([lat, lng], 12, { animate: true });
        }
        
        this.closeRegisterModal();
      },
      error: (err: any) => console.error('Failed to register shelter', err)
    });
  }

  private resetForm(): void {
    this.newShelterName = '';
    this.newShelterAddress = '';
    this.newShelterCapacity = null;
    this.newShelterOccupied = null;
    this.newShelterAmenities = '';
    this.newShelterLatitude = null;
    this.newShelterLongitude = null;
    this.newShelterRegion = 'Colombo';
  }

  private getCoordsFromAddress(address: string): { lat: number, lng: number } {
    const n = address.toLowerCase();
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
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.02,
        lng: base.lng + (Math.random() - 0.5) * 0.02
      };
    }

    return { lat: 6.9271, lng: 79.8612 };
  }

  private initMap() {
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded yet');
      return;
    }

    this.map = L.map('shelterMap', {
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

    this.shelters.forEach(s => {
      let lat = s.latitude;
      let lng = s.longitude;

      if (!lat || !lng || lat < 5.0 || lat > 10.0 || lng < 79.0 || lng > 83.0) {
        return; // skip rendering if no coordinates are present or invalid
      }

      let colorClass = 'bg-emerald-500 border-emerald-300';
      if (s.status === 'Limited') {
        colorClass = 'bg-amber-500 border-amber-300';
      } else if (s.status === 'Full') {
        colorClass = 'bg-rose-500 border-rose-300';
      }

      const shelterIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="px-2 py-1 ${colorClass} border rounded-lg flex items-center justify-center gap-1 shadow text-[10px] font-bold text-white whitespace-nowrap">
            🏠 <span>${s.occupied}/${s.capacity}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const marker = L.marker([lat, lng], { icon: shelterIcon });
      
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px;">${s.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #555;">📍 ${s.address}</p>
          <div style="font-size: 11px; font-weight: 600;">Occupancy: ${s.occupied} / ${s.capacity} beds (${Math.round((s.occupied/s.capacity)*100)}%)</div>
          <div style="margin-top: 5px; font-size: 10px; color: #888;">Status: ${s.status}</div>
        </div>
      `);
      
      this.markersGroup.addLayer(marker);
    });
  }
}