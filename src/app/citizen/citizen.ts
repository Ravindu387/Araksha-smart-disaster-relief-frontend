import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CitizenService } from '../Common/services/citizen.service';
import { EmergencyRequestService } from '../Common/services/emergency-request.service';
import { ShelterService } from '../services/shelter';
import { Shelter } from '../Common/models/shelter.model';
import { NotificationService, NotificationItem } from '../Common/services/notification.service';
import { OnInit } from '@angular/core';
import { Citizen as CitizenModel } from '../Common/models/citizen';
import { HttpErrorResponse } from '@angular/common/http';

declare const L: any;

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
  lat?: number;
  lng?: number;
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
export class Citizen implements OnInit, OnDestroy {
  citizen: CitizenModel | null = null;
  notifications: CitizenNotification[] = [];

  // Raw shelters from backend (full model with lat/lng)
  backendShelters: Shelter[] = [];

  // ── Sri Lanka coordinate lookup (shared with Admin) ───────────────────────
  private readonly sriLankaCoords: Record<string, { lat: number; lng: number }> = {
    'colombo':      { lat: 6.9271,  lng: 79.8612 },
    'gampaha':      { lat: 7.0873,  lng: 80.0164 },
    'kalutara':     { lat: 6.5854,  lng: 79.9607 },
    'kandy':        { lat: 7.2906,  lng: 80.6337 },
    'matale':       { lat: 7.4675,  lng: 80.6234 },
    'nuwara eliya': { lat: 6.9497,  lng: 80.7891 },
    'galle':        { lat: 6.0367,  lng: 80.2170 },
    'matara':       { lat: 5.9549,  lng: 80.5550 },
    'hambantota':   { lat: 6.1249,  lng: 81.1185 },
    'jaffna':       { lat: 9.6615,  lng: 80.0144 },
    'mannar':       { lat: 8.9810,  lng: 79.9044 },
    'vavuniya':     { lat: 8.7542,  lng: 80.4982 },
    'mullaitivu':   { lat: 9.2671,  lng: 80.8142 },
    'kilinochchi':  { lat: 9.3803,  lng: 80.3992 },
    'trincomalee':  { lat: 8.5873,  lng: 81.2152 },
    'batticaloa':   { lat: 7.7170,  lng: 81.7000 },
    'ampara':       { lat: 7.2833,  lng: 81.6667 },
    'kurunegala':   { lat: 7.4863,  lng: 80.3623 },
    'puttalam':     { lat: 8.0333,  lng: 79.8333 },
    'anuradhapura': { lat: 8.3114,  lng: 80.4037 },
    'polonnaruwa':  { lat: 7.9403,  lng: 81.0188 },
    'badulla':      { lat: 6.9934,  lng: 81.0550 },
    'moneragala':   { lat: 6.8724,  lng: 81.3507 },
    'ratnapura':    { lat: 6.6828,  lng: 80.3992 },
    'kegalle':      { lat: 7.2513,  lng: 80.3464 },
    'negombo':      { lat: 7.2089,  lng: 79.8373 },
  };

  /** Resolve lat/lng from a Shelter: prefer stored coords, else geocode from address */
  private resolveShelterCoords(s: Shelter): { lat: number; lng: number } | null {
    if (
      s.latitude && s.longitude &&
      s.latitude >= 5.0 && s.latitude <= 10.5 &&
      s.longitude >= 79.0 && s.longitude <= 83.0
    ) {
      return { lat: s.latitude, lng: s.longitude };
    }
    return this.geocodeAddress(s.address);
  }

  /** Geocode any Sri Lanka address string to coordinates */
  private geocodeAddress(address: string): { lat: number; lng: number } | null {
    if (!address) return null;
    const n = address.toLowerCase();
    const found = Object.keys(this.sriLankaCoords).find(k => n.includes(k));
    if (found) {
      const base = this.sriLankaCoords[found];
      // Small random offset so overlapping shelters in same city spread slightly
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.015,
        lng: base.lng + (Math.random() - 0.5) * 0.015,
      };
    }
    return null;
  }

  // ── Sri Lanka location dropdowns ──────────────────────────────────────────
  sriLankaProvinces = [
    'Western Province', 'Central Province', 'Southern Province',
    'Northern Province', 'Eastern Province', 'North Western Province',
    'North Central Province', 'Uva Province', 'Sabaragamuwa Province'
  ];

  sriLankaDistrictMap: Record<string, string[]> = {
    'Western Province':       ['Colombo', 'Gampaha', 'Kalutara'],
    'Central Province':       ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern Province':      ['Galle', 'Matara', 'Hambantota'],
    'Northern Province':      ['Jaffna', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Kilinochchi'],
    'Eastern Province':       ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western Province': ['Kurunegala', 'Puttalam'],
    'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
    'Uva Province':           ['Badulla', 'Monaragala'],
    'Sabaragamuwa Province':  ['Ratnapura', 'Kegalle']
  };

  selectedProvince = '';
  selectedDistrict = '';
  filteredDistricts: string[] = [];
  locationCity = '';
  locationStreet = '';

  onProvinceChange(): void {
    this.selectedDistrict = '';
    this.filteredDistricts = this.selectedProvince
      ? (this.sriLankaDistrictMap[this.selectedProvince] || [])
      : [];
    this.buildLocation();
  }

  onDistrictChange(): void {
    this.buildLocation();
  }

  buildLocation(): void {
    const parts = [
      this.locationStreet,
      this.locationCity,
      this.selectedDistrict,
      this.selectedProvince,
      'Sri Lanka'
    ].filter(p => p && p.trim().length > 0);
    this.location = parts.join(', ');
  }

  // ── Shelter Map Modal ─────────────────────────────────────────────────────
  showShelterMap = false;
  private shelterMapInstance: any = null;
  private citizenMarker: any = null;
  private shelterMarkersLayer: any = null;
  mapLoadingError = false;

  // ── Address entry INSIDE the map modal ───────────────────────────────────
  mapProvince = '';
  mapDistrict = '';
  mapCity     = '';
  mapFilteredDistricts: string[] = [];
  mapAddressBuilt = '';
  mapSearching = false;

  onMapProvinceChange(): void {
    this.mapDistrict = '';
    this.mapCity     = '';
    this.mapFilteredDistricts = this.mapProvince
      ? (this.sriLankaDistrictMap[this.mapProvince] || [])
      : [];
    this.buildMapAddress();
  }

  onMapDistrictChange(): void { this.buildMapAddress(); }

  buildMapAddress(): void {
    const parts = [
      this.mapCity,
      this.mapDistrict,
      this.mapProvince,
      'Sri Lanka'
    ].filter(p => p && p.trim().length > 0);
    this.mapAddressBuilt = parts.join(', ');
  }

  updateMapLocation(): void {
    if (!this.shelterMapInstance || !this.mapAddressBuilt) return;
    this.mapSearching = true;
    this.plotCitizenLocation(this.shelterMapInstance, this.mapAddressBuilt);
    this.updateShelterDistances(this.mapAddressBuilt);
    this.mapSearching = false;
  }

  /** Haversine formula – returns distance in km */
  private haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Recalculate and update shelter card distances from given address */
  private updateShelterDistances(address: string): void {
    const citizenCoords = this.geocodeAddress(address);
    if (!citizenCoords) return;

    this.shelters = this.backendShelters.map(s => {
      const coords = this.resolveShelterCoords(s);
      let distStr = '—';
      if (coords) {
        const km = this.haversineKm(
          citizenCoords.lat, citizenCoords.lng,
          coords.lat, coords.lng
        );
        distStr = km < 1
          ? Math.round(km * 1000) + ' m away'
          : km.toFixed(1) + ' km away';
      }
      return {
        id: 'SH-' + (s.id || ''),
        name: s.name,
        distance: distStr,
        status: s.status || 'Available',
        bedsFree: (s.capacity || 0) - (s.occupied || 0),
        lat: s.latitude,
        lng: s.longitude
      };
    }).sort((a, b) => {
      const toNum = (d: string) => {
        const m = d.match(/([\d.]+)/);
        if (!m) return 9999;
        const v = parseFloat(m[1]);
        return d.includes(' m ') ? v / 1000 : v;
      };
      return toNum(a.distance) - toNum(b.distance);
    });

    this.cdr.detectChanges();
  }

  // ── Selected shelter detail panel ─────────────────────────────────────────
  selectedShelterDetail: (ShelterInfo & { address?: string; amenities?: string[] }) | null = null;

  openShelterDetail(shelter: ShelterInfo): void {
    const raw = this.backendShelters.find(s => 'SH-' + (s.id || '') === shelter.id);
    this.selectedShelterDetail = {
      ...shelter,
      address: raw?.address || '',
      amenities: raw?.amenities || []
    };
  }

  closeShelterDetail(): void { this.selectedShelterDetail = null; }

  openShelterMap(): void {
    this.showShelterMap = true;
    this.mapLoadingError = false;
    // Pre-fill map address from citizen profile if available
    if (this.citizen?.address && !this.mapAddressBuilt) {
      this.mapAddressBuilt = this.citizen.address;
      // Try to extract district from stored address
      const addr = this.citizen.address.toLowerCase();
      for (const [prov, districts] of Object.entries(this.sriLankaDistrictMap)) {
        for (const dist of districts) {
          if (addr.includes(dist.toLowerCase())) {
            this.mapProvince = prov;
            this.mapDistrict = dist;
            this.mapFilteredDistricts = districts;
            break;
          }
        }
        if (this.mapDistrict) break;
      }
    }
    setTimeout(() => this.initShelterMap(), 350);
  }

  closeShelterMap(): void {
    this.showShelterMap = false;
    if (this.shelterMapInstance) {
      this.shelterMapInstance.remove();
      this.shelterMapInstance = null;
      this.citizenMarker = null;
      this.shelterMarkersLayer = null;
    }
  }

  private initShelterMap(): void {
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded');
      this.mapLoadingError = true;
      return;
    }
    const container = document.getElementById('citizenShelterMap');
    if (!container) return;

    // Centre on Sri Lanka
    const map = L.map('citizenShelterMap', { zoomControl: true }).setView([7.8731, 80.7718], 8);
    this.shelterMapInstance = map;

    // High-quality CARTO light tiles (same as Admin panel)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    this.shelterMarkersLayer = L.layerGroup().addTo(map);

    // ── Plot backend shelters ─────────────────────────────────────────────
    this.renderBackendSheltersOnMap(map);

    // ── Plot static volunteer positions ──────────────────────────────────
    this.renderVolunteersOnMap(map);

    // ── Show citizen's entered location on map ────────────────────────────
    const addrToPlot = this.mapAddressBuilt || this.location;
    if (addrToPlot && addrToPlot.trim().length > 3) {
      this.plotCitizenLocation(map, addrToPlot);
      this.updateShelterDistances(addrToPlot);
    }

    setTimeout(() => map.invalidateSize(), 100);
  }

  private makeCircleIcon(color: string, size = 16): any {
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  private makeShelterIcon(status: string, occupied: number, capacity: number): any {
    const colorClass = status === 'Available'
      ? 'bg-emerald-500 border-emerald-300'
      : status === 'Limited'
        ? 'bg-amber-500 border-amber-300'
        : 'bg-rose-500 border-rose-300';

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="px-2 py-1 ${colorClass} border rounded-lg flex items-center gap-1 shadow text-[10px] font-bold text-white whitespace-nowrap">
               🏠 <span>${occupied}/${capacity}</span>
             </div>`,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
  }

  private renderBackendSheltersOnMap(map: any): void {
    if (!this.shelterMarkersLayer) return;

    if (this.backendShelters.length === 0) {
      // Backend not available — fall back to static representative shelters
      const fallback = [
        { name: 'Colombo Relief Centre',   lat: 6.9271, lng: 79.8612, status: 'Available', occupied: 45, capacity: 120 },
        { name: 'Kandy Community Hall',     lat: 7.2906, lng: 80.6337, status: 'Limited',   occupied: 180, capacity: 200 },
        { name: 'Galle District Shelter',  lat: 6.0367, lng: 80.2170, status: 'Available', occupied: 30, capacity: 200 },
        { name: 'Jaffna Relief Hub',        lat: 9.6615, lng: 80.0255, status: 'Full',      occupied: 100, capacity: 100 },
        { name: 'Trinco Evacuation Point',  lat: 8.5874, lng: 81.2152, status: 'Available', occupied: 20, capacity: 88  },
        { name: 'Anuradhapura Centre',      lat: 8.3114, lng: 80.4037, status: 'Limited',   occupied: 55, capacity: 80  },
        { name: 'Ratnapura Relief Point',   lat: 6.6828, lng: 80.4014, status: 'Available', occupied: 15, capacity: 65  },
        { name: 'Batticaloa Hub',           lat: 7.7170, lng: 81.7000, status: 'Limited',   occupied: 40, capacity: 55  },
      ];
      fallback.forEach(s => {
        const icon = this.makeShelterIcon(s.status, s.occupied, s.capacity);
        L.marker([s.lat, s.lng], { icon })
          .addTo(this.shelterMarkersLayer)
          .bindPopup(this.buildShelterPopup(s.name, s.status, s.occupied, s.capacity, ''));
      });
      return;
    }

    // Plot real backend shelters
    this.backendShelters.forEach(s => {
      const coords = this.resolveShelterCoords(s);
      if (!coords) return;

      const icon = this.makeShelterIcon(s.status, s.occupied, s.capacity);
      L.marker([coords.lat, coords.lng], { icon })
        .addTo(this.shelterMarkersLayer)
        .bindPopup(this.buildShelterPopup(s.name, s.status, s.occupied, s.capacity, s.address));
    });
  }

  private buildShelterPopup(
    name: string, status: string,
    occupied: number, capacity: number, address: string
  ): string {
    const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
    const statusColor = status === 'Available' ? '#10b981' : status === 'Limited' ? '#f59e0b' : '#ef4444';
    return `
      <div style="font-family:sans-serif;min-width:180px;padding:6px 2px">
        <strong style="font-size:13px;color:#1e293b">${name}</strong>
        ${address ? `<p style="margin:4px 0 0;font-size:11px;color:#64748b">📍 ${address}</p>` : ''}
        <div style="margin:6px 0 4px;background:#f1f5f9;border-radius:6px;height:6px;overflow:hidden">
          <div style="height:6px;width:${pct}%;background:${statusColor};border-radius:6px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600">
          <span style="color:${statusColor}">${status}</span>
          <span style="color:#475569">${occupied}/${capacity} beds (${pct}%)</span>
        </div>
      </div>`;
  }

  private renderVolunteersOnMap(map: any): void {
    const volunteers = [
      { name: 'Volunteer Team – Colombo',    lat: 6.9347, lng: 79.8428, count: 12 },
      { name: 'Volunteer Team – Kurunegala', lat: 7.4863, lng: 80.3647, count: 8  },
      { name: 'Volunteer Team – Matara',     lat: 5.9549, lng: 80.5550, count: 5  },
      { name: 'Volunteer Team – Vavuniya',   lat: 8.7514, lng: 80.4997, count: 4  },
      { name: 'Volunteer Team – Badulla',    lat: 6.9934, lng: 81.0550, count: 6  },
      { name: 'Volunteer Team – Kandy',      lat: 7.2700, lng: 80.6400, count: 10 },
      { name: 'Volunteer Team – Galle',      lat: 6.0700, lng: 80.2300, count: 7  },
    ];

    const icon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background:#3b82f6;color:white;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(59,130,246,0.5)">👤</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    volunteers.forEach(v => {
      L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:150px;padding:4px 2px">
            <strong style="font-size:12px;color:#1e293b">${v.name}</strong><br>
            <span style="font-size:11px;color:#3b82f6;font-weight:600">● Active</span>
            <span style="font-size:11px;color:#64748b"> · ${v.count} volunteers</span>
          </div>`);
    });
  }

  /** Plot citizen's entered address as a pulsing red pin on the map */
  private plotCitizenLocation(map: any, address: string): void {
    const coords = this.geocodeAddress(address);
    if (!coords) return;

    const pulsingIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:24px;height:24px">
          <div style="position:absolute;top:0;left:0;width:24px;height:24px;border-radius:50%;background:rgba(239,68,68,0.3);animation:pulse 1.5s infinite"></div>
          <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.6)"></div>
        </div>
        <style>@keyframes pulse{0%{transform:scale(1);opacity:0.8}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}</style>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (this.citizenMarker) {
      this.citizenMarker.remove();
    }
    this.citizenMarker = L.marker([coords.lat, coords.lng], { icon: pulsingIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px 2px">
          <strong style="font-size:12px;color:#ef4444">📍 Your Location</strong><br>
          <span style="font-size:11px;color:#475569">${address}</span>
        </div>`)
      .openPopup();

    // Pan to citizen's location with animation
    map.flyTo([coords.lat, coords.lng], 11, { animate: true, duration: 1.2 });
  }

  /** Called from HTML when citizen clicks "Show My Location on Map" inside the map modal */
  showMyLocationOnMap(): void {
    if (!this.shelterMapInstance || !this.location) return;
    this.plotCitizenLocation(this.shelterMapInstance, this.location);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
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

  ngOnDestroy(): void {
    if (this.shelterMapInstance) {
      this.shelterMapInstance.remove();
      this.shelterMapInstance = null;
    }
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  loadCitizen(): void {
    const email = localStorage.getItem('email');
    if (email) {
      this.citizenService.getCitizenByEmail(email).subscribe({
        next: (data: CitizenModel) => {
          this.citizen = data;
          this.contactPhone = data.phoneNumber || '';
          this.loadRequests();
          this.loadNotifications();
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading citizen by email, falling back to ID 1', error);
          this.loadCitizenById(1);
        }
      });
    } else {
      this.loadCitizenById(1);
    }
  }

  private loadCitizenById(id: number): void {
    this.citizenService.getCitizenById(id).subscribe({
      next: (data: CitizenModel) => {
        this.citizen = data;
        this.contactPhone = data.phoneNumber || '';
        this.loadRequests();
        this.loadNotifications();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading citizen by ID', error);
      }
    });
  }

  isLocalAlert(notification: NotificationItem): boolean {
    if (!this.citizen) return false;
    const locationKeywords = ['colombo', 'kandy', 'galle', 'jaffna', 'sri lanka'];
    const title = (notification.title || '').toLowerCase();
    const desc  = (notification.description || '').toLowerCase();
    const addressParts = this.citizen.address
      ? this.citizen.address.toLowerCase().split(/[,\s]+/)
      : [];
    const keywords = new Set([...locationKeywords, ...addressParts].filter(w => w.length > 2));
    for (const kw of keywords) {
      if (title.includes(kw) || desc.includes(kw)) return true;
    }
    return false;
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
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
            date: r.requestTime
              ? new Date(r.requestTime).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: r.status === 'Completed'
              ? 'Resolved'
              : (r.status === 'Assigned' || r.status === 'In Progress' ? 'In Progress' : 'Pending'),
            responder: r.assignedVolunteer || '—',
            location: r.location,
            description: `${r.emergencyType} assistance requested.`,
            trackingMessage: r.status === 'In Progress'
              ? `${r.assignedVolunteer || 'Volunteer'} en route to your location`
              : undefined
          }));
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching emergency requests:', err)
    });
  }

  loadShelters(): void {
    this.shelterService.getShelters().subscribe({
      next: (shelters) => {
        this.backendShelters = shelters; // store full model for map use
        if (shelters && shelters.length > 0) {
          // If citizen address is known, compute real distances; else placeholder
          const citizenAddr = this.mapAddressBuilt || this.citizen?.address || this.location;
          const citizenCoords = citizenAddr ? this.geocodeAddress(citizenAddr) : null;

          this.shelters = shelters.map(s => {
            const coords = this.resolveShelterCoords(s);
            let distStr = citizenCoords && coords
              ? (() => {
                  const km = this.haversineKm(
                    citizenCoords.lat, citizenCoords.lng,
                    coords.lat, coords.lng
                  );
                  return km < 1
                    ? Math.round(km * 1000) + ' m away'
                    : km.toFixed(1) + ' km away';
                })()
              : '— km away';
            return {
              id: 'SH-' + (s.id || ''),
              name: s.name,
              distance: distStr,
              status: s.status || 'Available',
              bedsFree: (s.capacity || 0) - (s.occupied || 0),
              lat: s.latitude,
              lng: s.longitude
            };
          }).sort((a, b) => {
            const toNum = (d: string) => {
              const m = d.match(/([\d.]+)/);
              if (!m) return 9999;
              const v = parseFloat(m[1]);
              return d.includes(' m ') ? v / 1000 : v;
            };
            return toNum(a.distance) - toNum(b.distance);
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching shelters:', err)
    });
  }

  // ── Modal State ───────────────────────────────────────────────────────────
  showModal       = false;
  currentStep     = 1;
  showSosConfirm  = false;
  sosLoading      = false;
  showProfile     = false;
  showNotifications = false;

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
    if (this.showProfile) this.showNotifications = false;
  }
  closeProfile(): void { this.showProfile = false; }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.showProfile = false;
  }
  closeNotifications(): void { this.showNotifications = false; }

  // ── Form Fields ───────────────────────────────────────────────────────────
  selectedType  = '';
  description   = '';
  location      = '';
  contactPhone  = '';

  emergencyTypes = [
    'Flood', 'Fire', 'Earthquake', 'Hurricane',
    'Tornado', 'Medical Emergency', 'Landslide', 'Other'
  ];

  myRequests: EmergencyRequest[] = [
    {
      id: 'ER-2830',
      type: 'Flood Emergency',
      date: '2025-06-05',
      status: 'Resolved',
      responder: 'Tom Harris',
      location: 'Colombo, Western Province, Sri Lanka',
      description: 'Basement flooding rescue needed'
    },
    {
      id: 'ER-2847',
      type: 'Flood Emergency',
      date: '2025-06-07',
      status: 'In Progress',
      responder: 'James Wright',
      trackingMessage: 'James Wright en route · ETA 8 min',
      location: 'Kandy, Central Province, Sri Lanka',
      description: 'Minor flooding in the backyard'
    }
  ];

  shelters: ShelterInfo[] = [];

  // ── Modal Actions ─────────────────────────────────────────────────────────
  openReportModal(): void {
    this.showModal        = true;
    this.currentStep      = 1;
    this.selectedType     = '';
    this.description      = '';
    this.location         = '';
    this.locationCity     = '';
    this.locationStreet   = '';
    this.selectedProvince = '';
    this.selectedDistrict = '';
    this.filteredDistricts = [];
    this.contactPhone = this.citizen?.phoneNumber ?? '';
  }

  closeModal(): void { this.showModal = false; }

  openSosConfirm(): void  { this.showSosConfirm = true; }
  closeSosConfirm(): void { this.showSosConfirm = false; }

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
      location: this.citizen?.address || 'Current Location – Sri Lanka',
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

  selectType(type: string): void { this.selectedType = type; }

  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedType) return;
    if (this.currentStep === 2 && this.description.trim().length < 5) return;
    if (this.currentStep === 3 && this.location.trim().length < 5) return;
    if (this.currentStep === 4 && (!this.contactPhone || this.contactPhone.trim().length < 5)) return;
    if (this.currentStep < 5) { this.currentStep++; }
    else { this.submitRequest(); }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
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
        this.myRequests.unshift({
          id: reqId,
          type: `${this.selectedType} Emergency`,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          responder: '—',
          location: this.location,
          description: this.description,
          trackingMessage: undefined
        });
        this.showModal = false;
        this.cdr.detectChanges();
        this.loadRequests();
        setTimeout(() => this.scrollToSection('track-requests'), 300);
      },
      error: (err) => {
        console.error('Error submitting request:', err);
        alert('Failed to submit emergency request.');
      }
    });
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  }
}