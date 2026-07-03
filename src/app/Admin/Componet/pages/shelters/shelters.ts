import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Shelter } from '../../../../Common/models/shelter.model';
import { SearchService } from '../../../../Common/services/search.service';
import { ShelterService } from '../../../../services/shelter';
import { FileUploadService } from '../../../../Common/services/file-upload.service';

declare const L: any;

type FilterType = 'All' | 'Available' | 'Limited' | 'Full';

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shelters.html'
})
export class SheltersComponent implements OnInit, AfterViewInit, OnDestroy {

  shelters: Shelter[] = [];

  searchQuery = '';
  activeFilter: FilterType = 'All';
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  // ── Pagination state ──────────────────────────────────────────────────────
  currentPage = 0;           // 0-based
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // ── Filtered result ───────────────────────────────────────────────────────
  filteredShelters: Shelter[] = [];

  // ── Modal Form fields ─────────────────────────────────────────────────────
  registerModalOpen = false;
  newShelterName = '';
  newShelterAddress = '';
  newShelterCapacity: number | null = null;
  newShelterOccupied: number | null = null;
  predefinedAmenities = ['WiFi', 'Power', 'Water', 'Medical', 'Food', 'Blankets', 'Toilets', 'Security'];
  selectedAmenities: string[] = [];

  toggleAmenity(amenity: string): void {
    const idx = this.selectedAmenities.indexOf(amenity);
    if (idx >= 0) {
      this.selectedAmenities.splice(idx, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }
  newShelterLatitude: number | null = null;
  newShelterLongitude: number | null = null;
  newShelterRegion = 'Colombo';
  sriLankaRegions = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Gampaha', 'Kalutara', 'Matara', 'Hambantota',
    'Negombo', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Kurunegala',
    'Puttalam', 'Ratnapura', 'Kegalle', 'Badulla', 'Moneragala', 'Nuwara Eliya', 'Matale',
    'Vavuniya', 'Mannar', 'Mullaitivu', 'Kilinochchi', 'Ampara'
  ];

  // ── File Upload state ─────────────────────────────────────────────────────
  shelterImageFile: File | null = null;
  shelterImageUrl = '';
  shelterImageProgress = 0;
  shelterImageError = '';

  // ── Map ───────────────────────────────────────────────────────────────────
  private map: any;
  private markersGroup: any;

  // ── Internal ──────────────────────────────────────────────────────────────
  private searchSubject = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private shelterService: ShelterService,
    private fileUploadService: FileUploadService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Wire debounced search
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 0;
        this.loadSearchPage();
      })
    );

    // Wire global header search service subscription
    this.subscriptions.add(
      this.searchService.searchQuery$.subscribe(q => {
        if (this.searchQuery !== q) {
          this.searchQuery = q;
          this.searchSubject.next();
        }
      })
    );

    // Load full list for map
    this.loadShelters();
    // Load search results
    this.loadSearchPage();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Load helpers ──────────────────────────────────────────────────────────

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

  private loadSearchPage(): void {
    const sort = `${this.sortField},${this.sortDir}`;

    this.shelterService.searchShelters({
      keyword: this.searchQuery.trim() || undefined,
      status:  this.activeFilter === 'All' ? undefined : this.activeFilter,
      page:    this.currentPage,
      size:    this.pageSize,
      sort
    }).subscribe({
      next: (page) => {
        this.filteredShelters = page.content;
        this.totalPages    = page.totalPages;
        this.totalElements = page.totalElements;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Shelter search error', err)
    });
  }

  // ── File Selection & Upload Handlers ──────────────────────────────────────

  onShelterImageSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.shelterImageFile = files[0];
      this.shelterImageError = '';
      this.shelterImageProgress = 0;
      this.uploadShelterImage();
    }
  }

  uploadShelterImage(): void {
    if (!this.shelterImageFile) return;

    this.fileUploadService.uploadFile(this.shelterImageFile, 'ADMIN').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.shelterImageProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.shelterImageUrl = event.body.fileUrl;
          this.shelterImageProgress = 100;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.shelterImageProgress = 0;
        this.shelterImageError = err.error?.error || 'Failed to upload image';
        this.cdr.detectChanges();
      }
    });
  }

  removeShelterImage(): void {
    this.shelterImageFile = null;
    this.shelterImageUrl = '';
    this.shelterImageProgress = 0;
    this.shelterImageError = '';
  }

  // ── Search / filter triggers ──────────────────────────────────────────────

  onSearchChange(): void {
    this.searchSubject.next();
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.currentPage  = 0;
    this.loadSearchPage();
  }

  setSortField(field: string, dir: 'asc' | 'desc' = 'asc'): void {
    this.sortField   = field;
    this.sortDir     = dir;
    this.currentPage = 0;
    this.loadSearchPage();
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  setPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadSearchPage();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ── Stat card getters (from full list) ────────────────────────────────────

  get totalCapacity(): number {
    return this.shelters.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
  }

  get totalOccupied(): number {
    return this.shelters.reduce((sum, s) => sum + (s.occupied ?? 0), 0);
  }

  get availableBeds(): number {
    return this.totalCapacity - this.totalOccupied;
  }

  // ── Utility methods ───────────────────────────────────────────────────────

  getOccupancyPercent(shelter: Shelter): number {
    if (!shelter.capacity) return 0;
    return Math.min(100, Math.round((shelter.occupied / shelter.capacity) * 100));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Limited':   return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Full':      return 'bg-rose-50 text-rose-600 border-rose-200';
      default:          return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  getBarColor(status: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-500';
      case 'Limited':   return 'bg-amber-500';
      case 'Full':      return 'bg-rose-500';
      default:          return 'bg-slate-400';
    }
  }

  // ── Register modal ────────────────────────────────────────────────────────

  openRegisterModal(): void {
    this.registerModalOpen = true;
    this.removeShelterImage();
  }

  closeRegisterModal(): void {
    this.registerModalOpen = false;
    this.resetForm();
    this.removeShelterImage();
  }

  registerShelterSubmit(): void {
    if (!this.newShelterName || !this.newShelterAddress || !this.newShelterCapacity) {
      return;
    }

    const amenitiesArray = [...this.selectedAmenities];

    let lat = 6.9271;
    let lng = 79.8612;

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
      longitude: lng,
      shelterImageUrl: this.shelterImageUrl || undefined
    };

    this.shelterService.create(payload).subscribe({
      next: (created) => {
        this.shelters = [...this.shelters, created];
        this.renderMapMarkers();

        if (this.map) {
          this.map.setView([lat, lng], 12, { animate: true });
        }

        this.loadSearchPage();
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
    this.selectedAmenities = [];
    this.newShelterLatitude = null;
    this.newShelterLongitude = null;
    this.newShelterRegion = 'Colombo';
  }

  private getCoordsFromAddress(address: string): { lat: number, lng: number } {
    const n = address.toLowerCase();
    const regions: { [key: string]: { lat: number, lng: number } } = {
      'colombo':       { lat: 6.9271,  lng: 79.8612 },
      'kandy':         { lat: 7.2906,  lng: 80.6337 },
      'galle':         { lat: 6.0367,  lng: 80.2170 },
      'jaffna':        { lat: 9.6615,  lng: 80.0144 },
      'gampaha':       { lat: 7.0873,  lng: 80.0164 },
      'kalutara':      { lat: 6.5854,  lng: 79.9607 },
      'matara':        { lat: 5.9549,  lng: 80.5550 },
      'hambantota':    { lat: 6.1249,  lng: 81.1185 },
      'negombo':       { lat: 7.2089,  lng: 79.8373 },
      'batticaloa':    { lat: 7.7170,  lng: 81.7000 },
      'trincomalee':   { lat: 8.5873,  lng: 81.2152 },
      'anuradhapura':  { lat: 8.3114,  lng: 80.4037 },
      'polonnaruwa':   { lat: 7.9403,  lng: 81.0188 },
      'kurunegala':    { lat: 7.4863,  lng: 80.3623 },
      'puttalam':      { lat: 8.0333,  lng: 79.8333 },
      'ratnapura':     { lat: 6.6828,  lng: 80.3992 },
      'kegalle':       { lat: 7.2513,  lng: 80.3464 },
      'badulla':       { lat: 6.9934,  lng: 81.0550 },
      'moneragala':    { lat: 6.8724,  lng: 81.3507 },
      'nuwara eliya':  { lat: 6.9497,  lng: 80.7891 },
      'matale':        { lat: 7.4675,  lng: 80.6234 },
      'vavuniya':      { lat: 8.7542,  lng: 80.4982 },
      'mannar':        { lat: 8.9810,  lng: 79.9044 },
      'mullaitivu':    { lat: 9.2671,  lng: 80.8142 },
      'kilinochchi':   { lat: 9.3803,  lng: 80.3992 },
      'ampara':        { lat: 7.2833,  lng: 81.6667 }
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

  // ── Map ───────────────────────────────────────────────────────────────────

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
        return;
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