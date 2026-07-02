import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { ShelterService } from '../../../../services/shelter';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { NotificationService } from '../../../../Common/services/notification.service';
import { forkJoin, catchError, of } from 'rxjs';
import { WeatherService } from '../../../../services/weather.service';
import { MapsService } from '../../../../services/maps.service';

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
  private readonly weatherService = inject(WeatherService);
  private readonly mapsService = inject(MapsService);

  private coordsMap = new Map<string, { lat: number, lng: number }>();
  private currentRouteLine: any = null;
  private detourRouteLine: any = null;
  private traversedRouteLine: any = null;
  private hazardsGroup: any = null;
  private riskHeatmapGroup: any = null;
  private isRiskHeatmapVisible: boolean = false;
  private broadcastCircle: any = null;
  private broadcastMarker: any = null;

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
    if (this.currentRouteLine) {
      this.currentRouteLine.remove();
    }
    if (this.detourRouteLine) {
      this.detourRouteLine.remove();
    }
    if (this.traversedRouteLine) {
      this.traversedRouteLine.remove();
    }
    if (this.hazardsGroup) {
      this.hazardsGroup.remove();
    }
    if (this.riskHeatmapGroup) {
      this.riskHeatmapGroup.remove();
    }
    if (this.broadcastCircle) {
      this.broadcastCircle.remove();
    }
    if (this.broadcastMarker) {
      this.broadcastMarker.remove();
    }
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

      const updatedVol = { ...v, lat: newLat, lng: newLng };

      if (this.selectedMarker && (this.selectedMarker.id === v.id || 
          (this.selectedMarker.recommendedVolunteer && 'vol-' + this.selectedMarker.recommendedVolunteer.volunteerId === v.id))) {
        setTimeout(() => this.updateRouteProgress(updatedVol), 0);
      }

      this.coordsMap.set(v.id, { lat: newLat, lng: newLng });
      return updatedVol;
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
            team: v.location || 'Sector A',
            rating: v.rating || 5.0,
            tasks: v.tasks || 0,
            skills: v.skills || []
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
    this.hazardsGroup = L.layerGroup().addTo(this.map);
    this.riskHeatmapGroup = L.layerGroup();

    // Toggle button control
    const ToggleControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: (map: any) => {
        const btn = L.DomUtil.create('button', 'leaflet-bar');
        btn.innerHTML = '🌋 Toggle Risk Zones';
        btn.style.background = '#fef3c7';
        btn.style.color = '#b45309';
        btn.style.border = '2px solid #f59e0b';
        btn.style.padding = '5px 10px';
        btn.style.fontSize = '10px';
        btn.style.fontWeight = 'bold';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';

        L.DomEvent.on(btn, 'click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          this.toggleRiskHeatmap();
        });
        return btn;
      }
    });
    new ToggleControl().addTo(this.map);

    this.map.on('click', (e: any) => {
      if (e.originalEvent.shiftKey) {
        this.setupBroadcastZone(e.latlng.lat, e.latlng.lng);
      }
    });

    this.renderMapMarkers();
    this.loadHazardZones();
  }

  private loadHazardZones() {
    if (!this.map || !this.hazardsGroup) return;
    this.mapsService.getHazardZones().subscribe({
      next: (zones) => {
        this.hazardsGroup.clearLayers();
        zones.forEach(zone => {
          const circle = L.circle([zone.latitude, zone.longitude], {
            color: '#ef4444',
            fillColor: '#f87171',
            fillOpacity: 0.2,
            weight: 1.5,
            radius: zone.radiusKm * 1000
          }).addTo(this.hazardsGroup);

          circle.bindPopup(`
            <div style="font-family: sans-serif; padding: 2px; width: 160px;">
              <strong style="color: #c53030; font-size: 11px;">⚠️ ${zone.name}</strong>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #4b5563;">${zone.description}</p>
              <div style="margin-top: 4px; font-size: 9px; font-weight: bold; color: #ef4444;">Range: ${zone.radiusKm} km</div>
            </div>
          `);
        });
      },
      error: (err) => console.error('Failed to load active hazard overlays:', err)
    });
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
      
      const popupHtml = this.buildIncidentPopupHtml(inc);
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectMarker(inc, 'Incident');
        this.fetchIncidentDataAndDrawRoute(inc, marker);
        this.cdr.detectChanges();
      });

      marker.on('popupopen', () => {
        const reportBtn = document.getElementById(`btn-incident-report-${inc.id}`);
        if (reportBtn) {
          reportBtn.addEventListener('click', () => {
            const reqId = parseInt(inc.id.replace('inc-', ''));
            if (!isNaN(reqId)) {
              this.showEmergencyAuditReport(reqId);
            }
          });
        }
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
      
      const badges: string[] = [];
      if (vol.tasks >= 10) badges.push('Logistics Expert');
      if (vol.rating >= 4.8) badges.push('Community Hero');
      if (vol.skills && vol.skills.includes('Medical')) badges.push('First Responder');

      const badgesHtml = badges.map(b => 
        `<span style="font-size: 8px; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 2px 4px; border-radius: 4px; border: 1px solid #bae6fd; margin-right: 2px; margin-bottom: 2px; display: inline-block;">${b}</span>`
      ).join('');

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; width: 190px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(6, 182, 212, 0.1); color: #0891b2; border: 1px solid rgba(6, 182, 212, 0.2);">Volunteer</span>
            <span style="font-size: 9px; font-weight: bold; color: #0891b2;">⭐ ${vol.rating.toFixed(1)}</span>
          </div>
          <h4 style="margin: 4px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${vol.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">📍 ${vol.team} · Specialty: <b>${vol.role}</b></p>
          <div style="margin-bottom: 6px; display: flex; flex-wrap: wrap;">
            ${badgesHtml || '<span style="font-size: 8px; color: #94a3b8;">No badges earned yet</span>'}
          </div>
          <div style="margin-top: 4px; font-size: 10px; background: #f8fafc; border: 1px solid #f1f5f9; padding: 4px; border-radius: 4px; color: #475569; display: flex; justify-content: space-between;">
            <span>Tasks Completed:</span>
            <span style="font-weight: bold;">${vol.tasks}</span>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b;">📞 ${vol.phone}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectMarker(vol, 'Volunteer');
        this.fetchVolunteerMultiRoute(vol);
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
    if (this.currentRouteLine) {
      this.currentRouteLine.remove();
      this.currentRouteLine = null;
    }
    if (this.detourRouteLine) {
      this.detourRouteLine.remove();
      this.detourRouteLine = null;
    }
    if (this.traversedRouteLine) {
      this.traversedRouteLine.remove();
      this.traversedRouteLine = null;
    }
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

  fetchIncidentDataAndDrawRoute(inc: any, marker: any) {
    const reqId = parseInt(inc.id.replace('inc-', ''));
    if (isNaN(reqId)) return;

    if (this.currentRouteLine) {
      this.currentRouteLine.remove();
      this.currentRouteLine = null;
    }
    if (this.detourRouteLine) {
      this.detourRouteLine.remove();
      this.detourRouteLine = null;
    }
    inc.hasDetour = false;
    inc.detourReason = '';

    this.weatherService.getWeatherByCoords(inc.lat, inc.lng).pipe(
      catchError(err => {
        console.error('Failed to load weather for incident:', err);
        return of(null);
      })
    ).subscribe(weather => {
      if (weather) {
        inc.weather = weather;
        if (this.selectedMarker && this.selectedMarker.id === inc.id) {
          this.selectedMarker.weather = weather;
        }
        this.updatePopup(inc, marker);
      }

      this.mapsService.getNearestVolunteer(reqId).pipe(
        catchError(err => {
          console.error('Failed to load nearest volunteer for incident:', err);
          return of(null);
        })
      ).subscribe(volunteer => {
        if (volunteer && volunteer.volunteerId) {
          inc.recommendedVolunteer = volunteer;
          if (this.selectedMarker && this.selectedMarker.id === inc.id) {
            this.selectedMarker.recommendedVolunteer = volunteer;
          }
          this.updatePopup(inc, marker);

          this.mapsService.getRoute(volunteer.latitude, volunteer.longitude, inc.lat, inc.lng).pipe(
            catchError(err => {
              console.error('Failed to load route for incident:', err);
              return of(null);
            })
          ).subscribe(route => {
            if (route) {
              inc.route = route;
              if (this.selectedMarker && this.selectedMarker.id === inc.id) {
                this.selectedMarker.route = route;
              }
              this.updatePopup(inc, marker);

              if (this.map && route.coordinates && route.coordinates.length > 0) {
                const latLngs = route.coordinates.map((c: any) => [c.latitude, c.longitude]);
                this.currentRouteLine = L.polyline(latLngs, {
                  color: '#ef4444',
                  weight: 5,
                  opacity: 0.85,
                  dashArray: '4, 8'
                }).addTo(this.map);

                // Calculate overlap with hazards
                this.mapsService.getHazardZones().pipe(
                  catchError(() => of([]))
                ).subscribe(zones => {
                  let intersectedHazard: any = null;
                  for (const zone of zones) {
                    for (const pt of route.coordinates) {
                      const dist = this.calculateDistance(pt.latitude, pt.longitude, zone.latitude, zone.longitude);
                      if (dist < zone.radiusKm) {
                        intersectedHazard = zone;
                        break;
                      }
                    }
                    if (intersectedHazard) break;
                  }

                  if (intersectedHazard) {
                    const startPt = route.coordinates[0];
                    const endPt = route.coordinates[route.coordinates.length - 1];
                    const dy = endPt.latitude - startPt.latitude;
                    const dx = endPt.longitude - startPt.longitude;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const px = len > 0 ? -dy / len : 0;
                    const py = len > 0 ? dx / len : 1;
                    const offsetDeg = intersectedHazard.radiusKm * 1.3 * 0.009;
                    const waypointLat = intersectedHazard.latitude + py * offsetDeg;
                    const waypointLng = intersectedHazard.longitude + px * offsetDeg;

                    const detourLatLngs = [
                      [startPt.latitude, startPt.longitude],
                      [waypointLat, waypointLng],
                      [endPt.latitude, endPt.longitude]
                    ];

                    this.detourRouteLine = L.polyline(detourLatLngs, {
                      color: '#22c55e',
                      weight: 5,
                      opacity: 0.9,
                      dashArray: '5, 5'
                    }).addTo(this.map);

                    inc.hasDetour = true;
                    inc.detourReason = intersectedHazard.name;
                    this.updatePopup(inc, marker);
                  }
                });
              }
            }
          });
        }
      });
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  fetchVolunteerMultiRoute(vol: any) {
    if (this.currentRouteLine) {
      this.currentRouteLine.remove();
      this.currentRouteLine = null;
    }
    if (this.detourRouteLine) {
      this.detourRouteLine.remove();
      this.detourRouteLine = null;
    }

    const assigned = this.incidents.filter(i => 
      i.details && i.details.includes('Assigned Volunteer: ' + vol.name) && i.status === 'Active'
    );

    if (assigned.length === 0) return;

    const incidentIds = assigned.map(i => parseInt(i.id.replace('inc-', ''))).filter(id => !isNaN(id));
    if (incidentIds.length === 0) return;

    this.mapsService.getMultiRoute(vol.lat, vol.lng, incidentIds).pipe(
      catchError(err => {
        console.error('Failed to load multi-stop route:', err);
        return of(null);
      })
    ).subscribe(route => {
      if (route && this.map && route.coordinates && route.coordinates.length > 0) {
        const latLngs = route.coordinates.map((c: any) => [c.latitude, c.longitude]);
        this.currentRouteLine = L.polyline(latLngs, {
          color: '#06b6d4',
          weight: 6,
          opacity: 0.85
        }).addTo(this.map);
      }
    });
  }

  updateRouteProgress(vol: any) {
    if (!this.currentRouteLine || !this.selectedMarker || !this.selectedMarker.route) return;

    const route = this.selectedMarker.route;
    if (!route.coordinates || route.coordinates.length === 0) return;

    let closestIdx = 0;
    let minDist = 999999;
    for (let i = 0; i < route.coordinates.length; i++) {
      const pt = route.coordinates[i];
      const dist = this.calculateDistance(vol.lat, vol.lng, pt.latitude, pt.longitude);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    const traversed = route.coordinates.slice(0, closestIdx + 1).map((c: any) => [c.latitude, c.longitude]);
    const remaining = route.coordinates.slice(closestIdx).map((c: any) => [c.latitude, c.longitude]);

    if (this.traversedRouteLine) {
      this.traversedRouteLine.remove();
      this.traversedRouteLine = null;
    }
    if (traversed.length > 1) {
      this.traversedRouteLine = L.polyline(traversed, {
        color: '#94a3b8',
        weight: 4,
        opacity: 0.6
      }).addTo(this.map);
    }

    if (this.currentRouteLine) {
      this.currentRouteLine.remove();
      this.currentRouteLine = null;
    }
    if (remaining.length > 1) {
      this.currentRouteLine = L.polyline(remaining, {
        color: this.selectedMarker.markerType === 'Volunteer' ? '#06b6d4' : '#ef4444',
        weight: 5,
        opacity: 0.85,
        dashArray: '4, 8'
      }).addTo(this.map);
    }

    this.mapsService.updateVolunteerProgress(parseInt(vol.id.replace('vol-', '')), vol.lat, vol.lng).subscribe({
      error: (e) => console.error('Failed to log volunteer progress update:', e)
    });
  }

  setupBroadcastZone(lat: number, lng: number) {
    if (this.broadcastCircle) this.broadcastCircle.remove();
    if (this.broadcastMarker) this.broadcastMarker.remove();

    this.broadcastCircle = L.circle([lat, lng], {
      color: '#f97316',
      fillColor: '#fdba74',
      fillOpacity: 0.25,
      weight: 2,
      radius: 5000
    }).addTo(this.map);

    const popupHtml = `
      <div style="font-family:sans-serif;width:200px;padding:4px;line-height:1.4;">
        <strong style="color:#ea580c;font-size:12px;">🚨 Broadcast Alert</strong><br/>
        <span style="font-size:10px;color:#64748b;">Send radius alert to all citizens within <b>5km</b>.</span>
        <div style="margin-top:6px;">
          <input type="text" id="alert-broadcast-txt" placeholder="Enter emergency alert text..." style="width:100%;font-size:10px;padding:4px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        </div>
        <button id="alert-broadcast-btn" style="margin-top:6px;width:100%;background:#f97316;color:white;font-size:10px;font-weight:bold;padding:4px 8px;border:none;border-radius:4px;cursor:pointer;">Send Alert SMS</button>
      </div>
    `;

    this.broadcastMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background:#ea580c;color:white;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)">📢</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(this.map).bindPopup(popupHtml).openPopup();

    this.broadcastMarker.on('popupopen', () => {
      const btn = document.getElementById('alert-broadcast-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const txtEl = document.getElementById('alert-broadcast-txt') as HTMLInputElement;
          if (txtEl && txtEl.value.trim().length > 0) {
            this.sendRadiusBroadcast(lat, lng, 5.0, txtEl.value.trim());
          }
        });
      }
    });

    this.broadcastMarker.on('popupclose', () => {
      setTimeout(() => {
        if (this.broadcastCircle) {
          this.broadcastCircle.remove();
          this.broadcastCircle = null;
        }
        if (this.broadcastMarker) {
          this.broadcastMarker.remove();
          this.broadcastMarker = null;
        }
      }, 5000);
    });
  }

  sendRadiusBroadcast(lat: number, lng: number, radiusKm: number, message: string) {
    this.mapsService.broadcastRadiusAlert(lat, lng, radiusKm, message).subscribe({
      next: (res) => {
        alert(res.message || 'Radius broadcast successful!');
        if (this.broadcastCircle) {
          this.broadcastCircle.remove();
          this.broadcastCircle = null;
        }
        if (this.broadcastMarker) {
          this.broadcastMarker.remove();
          this.broadcastMarker = null;
        }
      },
      error: (err) => {
        console.error('Failed to broadcast radius warning alert:', err);
        alert('Failed to send alerts.');
      }
    });
  }

  toggleRiskHeatmap() {
    if (!this.map || !this.riskHeatmapGroup) return;
    this.isRiskHeatmapVisible = !this.isRiskHeatmapVisible;
    if (this.isRiskHeatmapVisible) {
      this.riskHeatmapGroup.addTo(this.map);
      this.loadRiskZones();
    } else {
      this.riskHeatmapGroup.remove();
    }
  }

  loadRiskZones() {
    if (!this.map || !this.riskHeatmapGroup) return;
    this.mapsService.getRiskZones().subscribe({
      next: (zones) => {
        this.riskHeatmapGroup.clearLayers();
        zones.forEach(zone => {
          const circle = L.circle([zone.latitude, zone.longitude], {
            color: '#f97316',
            fillColor: '#fdba74',
            fillOpacity: 0.25,
            weight: 2,
            radius: zone.radiusKm * 1000
          }).addTo(this.riskHeatmapGroup);

          circle.bindPopup(`
            <div style="font-family:sans-serif;width:160px;padding:2px;line-height:1.4;">
              <strong style="color:#c2410c;font-size:11px;">⚠️ Risk Area</strong><br/>
              <span style="font-size:11px;font-weight:bold;color:#4b5563;">${zone.name}</span><br/>
              <span style="font-size:10px;color:#64748b;">${zone.description}</span><br/>
              <span style="font-size:9px;font-weight:bold;color:#f97316;">Range: ${zone.radiusKm} km</span>
            </div>
          `);
        });
      },
      error: (err) => console.error('Failed to load risk zones:', err)
    });
  }

  showEmergencyAuditReport(id: number) {
    this.mapsService.getEmergencyReport(id).subscribe({
      next: (rep) => {
        const reportHtml = `
          <div style="font-family:sans-serif;width:260px;padding:6px;line-height:1.4;color:#1e293b;">
            <div style="border-bottom:2px solid #1e293b;padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:13px;text-transform:uppercase;color:#1e293b;">Araksha Audit Report</strong>
              <span style="font-size:8px;color:#64748b;">ID: REQ${rep.incidentId}</span>
            </div>
            <table style="width:100%;font-size:10px;border-collapse:collapse;">
              <tr>
                <td style="padding:3px 0;color:#64748b;">Emergency:</td>
                <td style="padding:3px 0;font-weight:bold;text-align:right;">${rep.title}</td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:#64748b;">Location:</td>
                <td style="padding:3px 0;text-align:right;">${rep.location}</td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:#64748b;">Severity:</td>
                <td style="padding:3px 0;font-weight:bold;color:#ef4444;text-align:right;">${rep.severity}</td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:#64748b;">Status:</td>
                <td style="padding:3px 0;font-weight:bold;color:#10b981;text-align:right;">${rep.status}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:4px 0 2px 0;color:#64748b;font-weight:bold;">Volunteer Assigned:</td>
                <td style="padding:4px 0 2px 0;font-weight:bold;text-align:right;color:#0f766e;">${rep.volunteerName}</td>
              </tr>
              <tr>
                <td style="padding:2px 0;color:#64748b;">Volunteer Phone:</td>
                <td style="padding:2px 0;text-align:right;">${rep.volunteerPhone}</td>
              </tr>
              <tr>
                <td style="padding:2px 0;color:#64748b;">Avg Distance / Duration:</td>
                <td style="padding:2px 0;text-align:right;font-weight:500;">${rep.distanceKm}km / ${rep.durationMinutes}m</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:4px 0;color:#64748b;font-weight:bold;" colspan="2">🎒 Allocated Logistics:</td>
              </tr>
              <tr>
                <td style="padding:2px 0 2px 10px;color:#475569;">💦 Water Release:</td>
                <td style="padding:2px 0;text-align:right;font-weight:bold;">${rep.waterAllocated} Liters</td>
              </tr>
              <tr>
                <td style="padding:2px 0 2px 10px;color:#475569;">🍱 Ration Kits:</td>
                <td style="padding:2px 0;text-align:right;font-weight:bold;">${rep.foodAllocated} kits</td>
              </tr>
              <tr>
                <td style="padding:2px 0 2px 10px;color:#475569;">💊 Medical Supplies:</td>
                <td style="padding:2px 0;text-align:right;font-weight:bold;">${rep.medicalAllocated} kits</td>
              </tr>
            </table>
            <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #cbd5e1;font-size:8px;color:#94a3b8;text-align:center;">
              Araksha Disaster Relief System © ${rep.timestamp.substring(0,10)}
            </div>
            <button onclick="window.print()" style="margin-top:8px;width:100%;background:#1e293b;color:white;font-size:10px;font-weight:bold;padding:5px;border:none;border-radius:4px;cursor:pointer;">🖨️ Print Audit Details</button>
          </div>
        `;
        
        if (this.map) {
          L.popup()
            .setLatLng(this.map.getCenter())
            .setContent(reportHtml)
            .openOn(this.map);
        }
      },
      error: (e) => {
        console.error('Failed to generate audit report:', e);
        alert('Could not compile audit report.');
      }
    });
  }

  private updatePopup(inc: any, marker: any) {
    const html = this.buildIncidentPopupHtml(inc);
    marker.setPopupContent(html);
  }

  private buildIncidentPopupHtml(inc: any): string {
    let detourSection = '';
    if (inc.hasDetour) {
      detourSection = `
        <div style="margin-top: 8px; padding: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 10px; color: #166534; line-height: 1.3;">
          🛡️ <b>Detour Active</b><br/>
          Safe path bypassing <b>${inc.detourReason}</b> visualized.
        </div>
      `;
    }

    let weatherSection = '';
    if (inc.weather) {
      weatherSection = `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">⛅ Weather Info</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px; font-size: 10px; color: #475569;">
            <div>🌡️ <b>${inc.weather.temperature.toFixed(1)}°C</b></div>
            <div>💧 Hum: <b>${inc.weather.humidity}%</b></div>
            <div>💨 Wind: <b>${inc.weather.windSpeed} km/h</b></div>
            <div>🌧️ Rain: <b>${inc.weather.rainProbability}%</b></div>
          </div>
          ${inc.weather.warnings && inc.weather.warnings !== 'None' ? `
            <div style="margin-top: 4px; padding: 4px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 4px; font-size: 9px; color: #c53030; font-weight: 500;">
              ⚠️ ${inc.weather.warnings}
            </div>
          ` : ''}
        </div>
      `;
    }

    let volunteerSection = '';
    if (inc.recommendedVolunteer) {
      const vol = inc.recommendedVolunteer;
      const eta = inc.route ? `${inc.route.durationMinutes.toFixed(0)} mins` : `${vol.durationMinutes.toFixed(0)} mins`;
      const dist = inc.route ? `${inc.route.distanceKm.toFixed(1)} km` : `${vol.distanceKm.toFixed(1)} km`;

      volunteerSection = `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 10px; font-weight: bold; color: #0891b2; text-transform: uppercase;">🏃 Recommended Volunteer</p>
          <div style="margin-top: 4px; font-size: 11px; color: #1e293b; font-weight: 600;">${vol.name}</div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 10px; color: #64748b;">
            <span>📞 ${vol.phone}</span>
            <span>⭐ ${vol.rating}</span>
          </div>
          <div style="margin-top: 4px; display: flex; justify-content: space-between; font-size: 10px; background: #ecfeff; border: 1px solid #c5f6fa; padding: 4px; border-radius: 4px; color: #0891b2; font-weight: 500;">
            <span>📏 Dist: ${dist}</span>
            <span>⏱️ ETA: ${eta}</span>
          </div>
        </div>
      `;
    }

    return `
      <div style="font-family: sans-serif; padding: 2px; width: 220px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Incident</span>
          <span style="font-size: 9px; font-weight: bold; color: #ef4444;">${inc.severity}</span>
        </div>
        <h4 style="margin: 4px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${inc.title}</h4>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">📍 ${inc.location}</p>
        <div style="font-size: 10px; color: #475569; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #f1f5f9;">${inc.details}</div>
        <button id="btn-incident-report-${inc.id}" style="margin-top: 8px; width: 100%; border: none; background: #1e293b; color: white; font-size: 10px; font-weight: bold; padding: 5px; border-radius: 4px; cursor: pointer;">📄 Control Audit Report</button>
        ${detourSection}
        ${weatherSection}
        ${volunteerSection}
      </div>
    `;
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
