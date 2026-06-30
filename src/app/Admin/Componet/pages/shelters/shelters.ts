import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shelter } from '../../../../Common/models/shelter.model';
import { ShelterService } from '../../../../services/shelter';

type FilterType = 'All' | 'Available' | 'Limited' | 'Full';

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shelters.html'
})
export class SheltersComponent implements OnInit {

  shelters: Shelter[] = [];

  searchQuery = '';
  activeFilter: FilterType = 'All';

  registerModalOpen = false;
  newShelterName = '';
  newShelterAddress = '';
  newShelterCapacity: number | null = null;
  newShelterOccupied: number | null = null;
  newShelterAmenities = '';

  constructor(private shelterService: ShelterService) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  loadShelters(): void {
    this.shelterService.getAll().subscribe({
      next: (data) => this.shelters = data,
      error: (err) => console.error('Failed to load shelters', err)
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

    const payload: Partial<Shelter> = {
      name: this.newShelterName,
      address: this.newShelterAddress,
      capacity: this.newShelterCapacity,
      occupied: this.newShelterOccupied ?? 0,
      amenities: amenitiesArray
    };

    this.shelterService.create(payload).subscribe({
      next: (created) => {
        this.shelters = [...this.shelters, created];
        this.closeRegisterModal();
      },
      error: (err) => console.error('Failed to register shelter', err)
    });
  }

  private resetForm(): void {
    this.newShelterName = '';
    this.newShelterAddress = '';
    this.newShelterCapacity = null;
    this.newShelterOccupied = null;
    this.newShelterAmenities = '';
  }
}