import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';

import { CitizenService } from '../Common/services/citizen.service';
import { EmergencyRequestService } from '../Common/services/emergency-request.service';
import { ShelterService } from '../services/shelter';
import { FileUploadService } from '../Common/services/file-upload.service';
import { Shelter } from '../Common/models/shelter.model';
import { NotificationService, NotificationItem } from '../Common/services/notification.service';
import { OnInit } from '@angular/core';
import { Citizen as CitizenModel } from '../Common/models/citizen';
import { HttpErrorResponse } from '@angular/common/http';
import { WeatherService } from '../services/weather.service';
import { MapsService } from '../services/maps.service';

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
  disasterImageUrl?: string;
  documentUrl?: string;
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
  weatherInfo: any = null;

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
    return this.getCoordsFromAddress(s.address || s.name);
  }

  private getCoordsFromAddress(address: string): { lat: number; lng: number } | null {
    const n = address.toLowerCase();
    const foundRegion = Object.keys(this.sriLankaCoords).find(region => n.includes(region));
    if (foundRegion) {
      const base = this.sriLankaCoords[foundRegion];
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.02,
        lng: base.lng + (Math.random() - 0.5) * 0.02
      };
    }
    return null;
  }

  private geocodeAddress(address: string): { lat: number; lng: number } {
    const resolved = this.getCoordsFromAddress(address);
    return resolved || { lat: 6.9271, lng: 79.8612 };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ── Sri Lanka Provinces & Districts configuration ────────────────────────
  readonly sriLankaProvinces: string[] = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  readonly provinceDistricts: Record<string, string[]> = {
    'Western':      ['Colombo', 'Gampaha', 'Kalutara'],
    'Central':      ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern':     ['Galle', 'Matara', 'Hambantota'],
    'Northern':     ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
    'Eastern':      ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western':['Kurunegala', 'Puttalam'],
    'North Central':['Anuradhapura', 'Polonnaruwa'],
    'Uva':          ['Badulla', 'Moneragala'],
    'Sabaragamuwa': ['Ratnapura', 'Kegalle']
  };

  selectedProvince = '';
  selectedDistrict = '';
  filteredDistricts: string[] = [];
  locationCity   = '';
  locationStreet = '';

  onProvinceChange(): void {
    this.selectedDistrict = '';
    this.filteredDistricts = this.selectedProvince ? this.provinceDistricts[this.selectedProvince] : [];
    this.buildLocation();
  }

  onDistrictChange(): void {
    this.buildLocation();
  }

  buildLocation(): void {
    const parts = [
      this.locationStreet.trim(),
      this.locationCity.trim(),
      this.selectedDistrict,
      this.selectedProvince ? this.selectedProvince + ' Province' : '',
      'Sri Lanka'
    ].filter(Boolean);
    this.location = parts.join(', ');
  }

  // ── Map search states ─────────────────────────────────────────────────────
  showShelterMap = false;
  mapProvince = '';
  mapDistrict = '';
  mapCity = '';
  mapAddressBuilt = '';
  mapFilteredDistricts: string[] = [];
  mapLoadingError = false;

  private shelterMapInstance: any = null;
  private citizenMarker: any = null;
  private shelterMarkersLayer: any = null;
  detectedLat: number | null = null;
  detectedLng: number | null = null;
  private routeLine: any = null;

  readonly sriLankaProvincesForMap: string[] = this.sriLankaProvinces;
  readonly mapProvinceDistricts: Record<string, string[]> = this.provinceDistricts;

  onMapProvinceChange(): void {
    this.mapDistrict = '';
    this.mapFilteredDistricts = this.mapProvince ? this.mapProvinceDistricts[this.mapProvince] : [];
    this.buildMapAddress();
  }

  onMapDistrictChange(): void {
    this.buildMapAddress();
  }

  buildMapAddress(): void {
    const parts = [
      this.mapCity.trim(),
      this.mapDistrict,
      this.mapProvince ? this.mapProvince + ' Province' : '',
      'Sri Lanka'
    ].filter(Boolean);
    this.mapAddressBuilt = parts.join(', ');
  }

  updateMapLocation(): void {
    if (!this.shelterMapInstance || !this.mapAddressBuilt) return;
    this.plotCitizenLocation(this.shelterMapInstance, this.mapAddressBuilt);
    this.updateShelterDistances(this.mapAddressBuilt);
  }

  private updateShelterDistances(centerAddress: string): void {
    const centerCoords = this.geocodeAddress(centerAddress);
    if (!centerCoords) return;

    this.mapsService.getNearbyShelters(centerCoords.lat, centerCoords.lng).subscribe({
      next: (shelterDTOs) => {
        if (shelterDTOs && shelterDTOs.length > 0) {
          const closest = shelterDTOs[0];
          if (closest.redirectionTarget) {
            this.showRedirectionWarningOnMap(
              closest.name, 
              closest.latitude, closest.longitude,
              closest.redirectionTarget, 
              closest.redirectLat || 0, closest.redirectLng || 0
            );
          }
        }
      },
      error: (err) => console.error('Failed to load redirection shelter alerts:', err)
    });

    this.shelters = this.backendShelters.map(s => {
      const coords = this.resolveShelterCoords(s);
      let distStr = coords
        ? (() => {
            const km = this.haversineKm(centerCoords.lat, centerCoords.lng, coords.lat, coords.lng);
            return km < 1 ? Math.round(km * 1000) + ' m away' : km.toFixed(1) + ' km away';
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
    this.cdr.detectChanges();
  }

  // ── Shelter details inside map ──────────────────────────────────────────
  selectedShelterDetail: any = null;
  openShelterDetail(sh: any): void {
    const realShelter = this.backendShelters.find(s => ('SH-' + s.id) === sh.id);
    if (realShelter) {
      this.selectedShelterDetail = {
        name: realShelter.name,
        address: realShelter.address,
        bedsFree: (realShelter.capacity || 0) - (realShelter.occupied || 0),
        status: realShelter.status || 'Available',
        distance: sh.distance,
        amenities: realShelter.amenities
      };
    } else {
      this.selectedShelterDetail = sh;
    }
  }
  closeShelterDetail(): void { this.selectedShelterDetail = null; }

  openShelterMap(): void {
    this.showShelterMap = true;
    this.mapProvince = '';
    this.mapDistrict = '';
    this.mapCity = '';
    this.mapAddressBuilt = '';
    this.mapFilteredDistricts = [];
    if (this.citizen) {
      const addr = this.citizen.address || '';
      const lowerAddr = addr.toLowerCase();
      const provMatch = this.sriLankaProvinces.find(p => lowerAddr.includes(p.toLowerCase()));
      if (provMatch) {
        this.mapProvince = provMatch;
        this.mapFilteredDistricts = this.mapProvinceDistricts[provMatch];
        const distMatch = this.mapFilteredDistricts.find(d => lowerAddr.includes(d.toLowerCase()));
        if (distMatch) {
          this.mapDistrict = distMatch;
        }
      }
      this.buildMapAddress();
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
    if (this.routeLine) {
      this.routeLine.remove();
      this.routeLine = null;
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    this.shelterMarkersLayer = L.layerGroup().addTo(map);

    // Plot backend shelters
    this.renderBackendSheltersOnMap(map);

    // Plot static volunteer positions
    this.renderVolunteersOnMap(map);

    // Show citizen's device location or profile location on map
    this.getUserLocationForMap(map);

    setTimeout(() => map.invalidateSize(), 100);
  }

  getUserLocationForMap(map: any): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

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
          this.citizenMarker = L.marker([lat, lng], { icon: pulsingIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;padding:4px 2px">
                <strong style="font-size:12px;color:#ef4444">📍 Detected Location</strong><br>
                <span style="font-size:11px;color:#475569">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
              </div>`)
            .openPopup();

          map.setView([lat, lng], 13);
          this.mapAddressBuilt = 'GPS Coordinates: ' + lat.toFixed(4) + ', ' + lng.toFixed(4);

          this.shelters = this.backendShelters.map(s => {
            const coords = this.resolveShelterCoords(s);
            let distStr = coords
              ? (() => {
                  const km = this.haversineKm(lat, lng, coords.lat, coords.lng);
                  return km < 1 ? Math.round(km * 1000) + ' m away' : km.toFixed(1) + ' km away';
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
          this.cdr.detectChanges();
        },
        (error) => {
          console.warn('Geolocation error:', error);
          const addrToPlot = this.citizen?.address || this.location || 'Colombo, Sri Lanka';
          this.mapAddressBuilt = addrToPlot;
          if (addrToPlot && addrToPlot.trim().length > 3) {
            this.plotCitizenLocation(map, addrToPlot);
            this.updateShelterDistances(addrToPlot);
          }
        }
      );
    } else {
      const addrToPlot = this.citizen?.address || this.location || 'Colombo, Sri Lanka';
      this.mapAddressBuilt = addrToPlot;
      if (addrToPlot && addrToPlot.trim().length > 3) {
        this.plotCitizenLocation(map, addrToPlot);
        this.updateShelterDistances(addrToPlot);
      }
    }
  }

  useDeviceLocationForMap(): void {
    if (this.shelterMapInstance) {
      this.getUserLocationForMap(this.shelterMapInstance);
    }
  }

  drawRouteToShelter(shelterLat: number, shelterLng: number): void {
    if (!this.shelterMapInstance || !this.detectedLat || !this.detectedLng) return;

    if (this.routeLine) {
      this.routeLine.remove();
    }

    const points = [
      [this.detectedLat, this.detectedLng],
      [shelterLat, shelterLng]
    ];

    this.routeLine = L.polyline(points, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.shelterMapInstance);

    this.shelterMapInstance.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  getGoogleMapsNavUrl(shelter: any): string {
    const origin = this.detectedLat && this.detectedLng ? `${this.detectedLat},${this.detectedLng}` : '';
    const dest = shelter.lat && shelter.lng ? `${shelter.lat},${shelter.lng}` : encodeURIComponent(shelter.address || shelter.name);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
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
          <strong style="font-size:12px;color:#ef4444">📍 Detected Location</strong><br>
          <span style="font-size:11px;color:#475569">${address}</span>
        </div>`)
      .openPopup();

    map.flyTo([coords.lat, coords.lng], 11, { animate: true, duration: 1.2 });
    this.loadNeighborAidMatches(coords.lat, coords.lng);
  }

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
    private fileUploadService: FileUploadService,
    private cdr: ChangeDetectorRef,
    private weatherService: WeatherService,
    private mapsService: MapsService
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
    if (this.neighborRouteLine) {
      this.neighborRouteLine.remove();
    }
    if (this.neighborMarkersLayer) {
      this.neighborMarkersLayer.remove();
    }
    if (this.redirectionRouteLine) {
      this.redirectionRouteLine.remove();
    }
  }

  redirectionRouteLine: any = null;

  showRedirectionWarningOnMap(
    fromName: string, fromLat: number, fromLng: number,
    toName: string, toLat: number, toLng: number
  ) {
    if (this.redirectionRouteLine) {
      this.redirectionRouteLine.remove();
      this.redirectionRouteLine = null;
    }

    if (!this.shelterMapInstance) return;

    this.mapsService.getRoute(fromLat, fromLng, toLat, toLng).subscribe({
      next: (route) => {
        if (route && this.shelterMapInstance && route.coordinates && route.coordinates.length > 0) {
          const latLngs = route.coordinates.map((c: any) => [c.latitude, c.longitude]);
          this.redirectionRouteLine = L.polyline(latLngs, {
            color: '#f97316',
            weight: 6,
            opacity: 0.9,
            dashArray: '8, 8'
          }).addTo(this.shelterMapInstance);

          const redirectIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="background:#f97316;color:white;border:2px solid #ffedd5;border-radius:6px;padding:3px 6px;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.2)">👉 Redirect to ${toName}</div>`,
            iconSize: [140, 24],
            iconAnchor: [70, 12]
          });

          L.marker([toLat, toLng], { icon: redirectIcon })
            .addTo(this.neighborMarkersLayer || this.shelterMapInstance)
            .bindPopup(`
              <div style="font-family:sans-serif;padding:2px;width:160px;line-height:1.4;">
                <strong style="color:#d97706;font-size:12px;">⚠️ Capacity Redirection</strong><br/>
                <span style="font-size:11px;color:#4b5563;">Closest shelter <b>${fromName}</b> is full. Please proceed to <b>${toName}</b>.</span>
              </div>
            `)
            .openPopup();
        }
      },
      error: (err) => console.error('Failed to trace redirection path:', err)
    });
  }

  neighborAidMatches: any[] = [];
  neighborMarkersLayer: any = null;
  neighborRouteLine: any = null;

  loadNeighborAidMatches(lat: number, lng: number): void {
    if (!this.neighborMarkersLayer && this.shelterMapInstance) {
      this.neighborMarkersLayer = L.layerGroup().addTo(this.shelterMapInstance);
    }

    this.mapsService.getAidMatches(lat, lng, 'NEED').subscribe({
      next: (offers) => {
        this.mapsService.getAidMatches(lat, lng, 'OFFER').subscribe({
          next: (needs) => {
            this.neighborAidMatches = [
              ...offers.map(o => ({ ...o, matchType: 'OFFER' })), 
              ...needs.map(n => ({ ...n, matchType: 'NEED' }))
            ];
            this.plotNeighborAidOnMap();
          }
        });
      }
    });
  }

  plotNeighborAidOnMap(): void {
    if (!this.neighborMarkersLayer) return;
    this.neighborMarkersLayer.clearLayers();

    this.neighborAidMatches.forEach(item => {
      const emoji = item.matchType === 'OFFER' ? '🎁' : '🙋';
      const color = item.matchType === 'OFFER' ? '#10b981' : '#8b5cf6';
      const border = item.matchType === 'OFFER' ? '#a7f3d0' : '#ddd6fe';

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background:${color};border:2px solid ${border};color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${emoji}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([item.latitude, item.longitude], { icon })
        .addTo(this.neighborMarkersLayer);

      const popupHtml = `
        <div style="font-family:sans-serif;min-width:160px;padding:4px 2px;line-height:1.4;">
          <strong style="font-size:12px;color:#1e293b">${item.matchType === 'OFFER' ? '🎁 Neighbor Offer' : '🙋 Neighbor Need'}</strong><br/>
          <span style="font-size:11px;font-weight:bold;color:#4b5563;">${item.itemType}</span><br/>
          <span style="font-size:10px;color:#64748b;">${item.description || 'No description'}</span><br/>
          <div style="margin-top: 4px; font-size:10px; font-weight:600; color:#3b82f6;">📞 ${item.contactPhone}</div>
          <button id="btn-neighbor-route-${item.id}" style="margin-top:6px;width:100%;border:none;background:#3b82f6;color:white;font-size:10px;font-weight:600;padding:4px 8px;border-radius:4px;cursor:pointer;">Show Directions</button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-neighbor-route-${item.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            this.drawNeighborRoute(item.latitude, item.longitude);
          });
        }
      });
    });
  }

  drawNeighborRoute(targetLat: number, targetLng: number): void {
    if (this.neighborRouteLine) {
      this.neighborRouteLine.remove();
      this.neighborRouteLine = null;
    }

    const citizenAddr = this.mapAddressBuilt || this.citizen?.address || this.location;
    const citizenCoords = citizenAddr ? this.geocodeAddress(citizenAddr) : { lat: 6.9271, lng: 79.8612 };

    this.mapsService.getRoute(citizenCoords.lat, citizenCoords.lng, targetLat, targetLng).subscribe({
      next: (route) => {
        if (route && this.shelterMapInstance && route.coordinates && route.coordinates.length > 0) {
          const latLngs = route.coordinates.map((c: any) => [c.latitude, c.longitude]);
          this.neighborRouteLine = L.polyline(latLngs, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.85,
            dashArray: '6, 6'
          }).addTo(this.shelterMapInstance);
        }
      },
      error: (err) => console.error('Failed to trace route to neighbor:', err)
    });
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
          this.loadWeatherForCitizen();
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
        this.loadWeatherForCitizen();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading citizen by ID', error);
      }
    });
  }

  loadWeatherForCitizen(): void {
    if (this.citizen && this.citizen.address) {
      const city = this.citizen.address.split(',')[0] || 'Colombo';
      this.weatherService.getWeatherByCity(city).subscribe({
        next: (info) => {
          this.weatherInfo = info;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load citizen weather:', err)
      });
    }
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
            disasterImageUrl: r.disasterImageUrl,
            documentUrl: r.documentUrl,
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
          const citizenAddr = this.mapAddressBuilt || this.citizen?.address || this.location;
          const citizenCoords = citizenAddr ? this.geocodeAddress(citizenAddr) : { lat: 6.9271, lng: 79.8612 };

          this.mapsService.getNearbyShelters(citizenCoords.lat, citizenCoords.lng).subscribe({
            next: (nearbyList) => {
              this.shelters = nearbyList.map(s => ({
                id: 'SH-' + s.shelterId,
                name: s.name,
                distance: s.distanceKm < 1 ? Math.round(s.distanceKm * 1000) + ' m away' : s.distanceKm.toFixed(1) + ' km away',
                status: s.status,
                bedsFree: s.capacity - s.occupied,
                lat: s.latitude,
                lng: s.longitude
              }));
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Distance matrix call failed, falling back to local calculation:', err);
              // Fallback to local haversine
              this.shelters = shelters.map(s => {
                const coords = this.resolveShelterCoords(s);
                let distStr = citizenCoords && coords
                  ? (() => {
                      const km = this.haversineKm(citizenCoords.lat, citizenCoords.lng, coords.lat, coords.lng);
                      return km < 1 ? Math.round(km * 1000) + ' m away' : km.toFixed(1) + ' km away';
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
              this.cdr.detectChanges();
            }
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

  myRequests: EmergencyRequest[] = [];

  shelters: ShelterInfo[] = [];

  // ── File Upload state ─────────────────────────────────────────────────────
  disasterImageFile: File | null = null;
  disasterImageUrl = '';
  disasterImageProgress = 0;
  disasterImageError = '';

  supportingDocFile: File | null = null;
  supportingDocUrl = '';
  supportingDocProgress = 0;
  supportingDocError = '';

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
    this.removeDisasterImage();
    this.removeSupportingDoc();
  }

  closeModal(): void { 
    this.showModal = false; 
    this.removeDisasterImage();
    this.removeSupportingDoc();
  }

  openSosConfirm(): void  { this.showSosConfirm = true; }
  closeSosConfirm(): void { this.showSosConfirm = false; }

  // ── File Selection & Upload Handlers ──────────────────────────────────────

  onDisasterImageSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.disasterImageFile = files[0];
      this.disasterImageError = '';
      this.disasterImageProgress = 0;
      this.uploadDisasterImage();
    }
  }

  uploadDisasterImage(): void {
    if (!this.disasterImageFile) return;

    this.fileUploadService.uploadFile(this.disasterImageFile, this.citizen?.fullName).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.disasterImageProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.disasterImageUrl = event.body.fileUrl;
          this.disasterImageProgress = 100;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.disasterImageProgress = 0;
        this.disasterImageError = err.error?.error || 'Failed to upload image';
        this.cdr.detectChanges();
      }
    });
  }

  removeDisasterImage(): void {
    this.disasterImageFile = null;
    this.disasterImageUrl = '';
    this.disasterImageProgress = 0;
    this.disasterImageError = '';
  }

  onSupportingDocSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.supportingDocFile = files[0];
      this.supportingDocError = '';
      this.supportingDocProgress = 0;
      this.uploadSupportingDoc();
    }
  }

  uploadSupportingDoc(): void {
    if (!this.supportingDocFile) return;

    this.fileUploadService.uploadFile(this.supportingDocFile, this.citizen?.fullName).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.supportingDocProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.supportingDocUrl = event.body.fileUrl;
          this.supportingDocProgress = 100;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.supportingDocProgress = 0;
        this.supportingDocError = err.error?.error || 'Failed to upload document';
        this.cdr.detectChanges();
      }
    });
  }

  removeSupportingDoc(): void {
    this.supportingDocFile = null;
    this.supportingDocUrl = '';
    this.supportingDocProgress = 0;
    this.supportingDocError = '';
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
      requestTime: new Date().toISOString(),
      disasterImageUrl: this.disasterImageUrl || undefined,
      documentUrl: this.supportingDocUrl || undefined
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
          disasterImageUrl: this.disasterImageUrl || undefined,
          documentUrl: this.supportingDocUrl || undefined,
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

  // ── Citizen Dashboard Enhancements logic ──────────────────────────────────
  neighborActiveTab: 'view' | 'create' = 'view';
  newAidType: 'NEED' | 'OFFER' = 'NEED';
  newAidItem = '';
  newAidDescription = '';
  newAidContact = '';
  aidSubmitting = false;

  getSafetyIndex(): { rating: string; color: string; bgClass: string; description: string } {
    if (!this.weatherInfo) {
      return { rating: 'Unknown', color: 'text-slate-500', bgClass: 'bg-slate-50 border-slate-200', description: 'Weather information not available.' };
    }
    const temp = this.weatherInfo.main?.temp || 28;
    const desc = (this.weatherInfo.weather?.[0]?.description || '').toLowerCase();
    
    if (desc.includes('storm') || desc.includes('cyclone') || desc.includes('heavy rain')) {
      return { rating: 'EVACUATE / PREPARE', color: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-200', description: 'Severe warning active. Secure valuables and seek higher ground.' };
    } else if (desc.includes('rain') || desc.includes('drizzle') || temp > 35) {
      return { rating: 'MONITOR ALERTS', color: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200', description: 'Light precipitation or high temp. Monitor official channels.' };
    }
    return { rating: 'SAFE STATUS', color: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200', description: 'No extreme atmospheric warnings active in your region.' };
  }

  getStepIndex(status: string): number {
    const s = status.toLowerCase();
    if (s === 'pending') return 1;
    if (s === 'assigned') return 2;
    if (s === 'in progress') return 3;
    if (s === 'resolved' || s === 'completed') return 4;
    return 1;
  }

  postNeighborAid(): void {
    if (!this.newAidItem.trim() || !this.newAidContact.trim()) {
      alert('Please fill out the item name and contact phone.');
      return;
    }

    this.aidSubmitting = true;
    
    // Construct local mock match to update UI immediately
    const userAddr = this.mapAddressBuilt || this.citizen?.address || this.location || 'Colombo, Sri Lanka';
    const coords = this.geocodeAddress(userAddr);

    const newMatch = {
      id: Math.floor(1000 + Math.random() * 9000),
      matchType: this.newAidType,
      itemType: this.newAidItem,
      description: this.newAidDescription,
      contactPhone: this.newAidContact,
      latitude: coords.lat,
      longitude: coords.lng,
      distanceKm: 0.1
    };

    // Simulate service latency
    setTimeout(() => {
      this.neighborAidMatches.unshift(newMatch);
      this.plotNeighborAidOnMap();
      this.newAidItem = '';
      this.newAidDescription = '';
      this.newAidContact = this.citizen?.phoneNumber || '';
      this.neighborActiveTab = 'view';
      this.aidSubmitting = false;
      this.cdr.detectChanges();
    }, 600);
  }
}