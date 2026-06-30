import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ShelterService } from '../../../../services/shelter';

interface Shelter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  amenities: string[];
  lastUpdated: string;
  status: 'Available' | 'Limited' | 'Full';
}

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule,HttpClientModule],
  templateUrl: './shelters.html',
  styleUrl: './shelters.css',
})
export class Shelters implements OnInit{


  shelters: any[] = [];

  constructor(private shelterService: ShelterService) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  loadShelters() {
    this.shelterService.getShelters().subscribe(data => {
      this.shelters = data;
    });
  }


  searchQuery = '';
  activeFilter: 'All' | 'Available' | 'Limited' | 'Full' = 'All';

  registerModalOpen = false;
  newShelterName = '';
  newShelterAddress = '';
  newShelterCapacity = '';
  newShelterOccupied = '';
  newShelterAmenities = '';

  shedlters: Shelter[] = [
    {
      id: 'SH-101',
      name: 'Houston Community Center',
      address: '4800 Main St, Houston, TX 77002',
      capacity: 500,
      occupied: 432,
      amenities: ['WiFi', 'Power', 'Water', 'Medical'],
      lastUpdated: '10 min ago',
      status: 'Limited',
    },
    {
      id: 'SH-102',
      name: 'Miami-Dade Evacuation Center',
      address: '3350 NW 27th Ave, Miami, FL 33142',
      capacity: 1200,
      occupied: 1190,
      amenities: ['Power', 'Water', 'Food'],
      lastUpdated: '5 min ago',
      status: 'Full',
    },
    {
      id: 'SH-103',
      name: 'Chicago Metro Shelter',
      address: '100 W Randolph St, Chicago, IL 60601',
      capacity: 350,
      occupied: 89,
      amenities: ['WiFi', 'Power', 'Water', 'Medical', 'Childcare'],
      lastUpdated: '1h ago',
      status: 'Available',
    },
    {
      id: 'SH-104',
      name: 'Los Angeles Relief Hub',
      address: '200 N Spring St, Los Angeles, CA 90012',
      capacity: 800,
      occupied: 620,
      amenities: ['WiFi', 'Power', 'Water'],
      lastUpdated: '22 min ago',
      status: 'Limited',
    },
    {
      id: 'SH-105',
      name: 'San Jose Emergency Shelter',
      address: '200 E Santa Clara St, San Jose, CA 95113',
      capacity: 300,
      occupied: 55,
      amenities: ['Power', 'Water', 'Medical'],
      lastUpdated: '45 min ago',
      status: 'Available',
    },
    {
      id: 'SH-106',
      name: 'Phoenix Desert Relief Center',
      address: '200 W Washington St, Phoenix, AZ 85003',
      capacity: 400,
      occupied: 192,
      amenities: ['WiFi', 'Power', 'Water', 'Food'],
      lastUpdated: '2h ago',
      status: 'Available',
    },
  ];

  get totalCapacity(): number {
    return this.shelters.reduce((sum, s) => sum + s.capacity, 0);
  }

  get totalOccupied(): number {
    return this.shelters.reduce((sum, s) => sum + s.occupied, 0);
  }

  get availableBeds(): number {
    return this.totalCapacity - this.totalOccupied;
  }

  get filteredShelters(): Shelter[] {
    const q = this.searchQuery.toLowerCase();
    return this.shelters.filter(s => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
      const matchesFilter = this.activeFilter === 'All' || s.status === this.activeFilter;
      return matchesSearch && matchesFilter;
    });
  }

  setFilter(filter: 'All' | 'Available' | 'Limited' | 'Full'): void {
    this.activeFilter = filter;
  }

  getOccupancyPercent(shelter: Shelter): number {
    return Math.round((shelter.occupied / shelter.capacity) * 100);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Available': 'border-emerald-300 text-emerald-600 bg-emerald-50',
      'Limited': 'border-amber-300 text-amber-600 bg-amber-50',
      'Full': 'border-rose-300 text-rose-600 bg-rose-50',
    };
    return map[status] ?? 'border-gray-200 text-gray-600 bg-gray-50';
  }

  getBarColor(status: string): string {
    const map: Record<string, string> = {
      'Available': 'bg-emerald-500',
      'Limited': 'bg-amber-500',
      'Full': 'bg-rose-500',
    };
    return map[status] ?? 'bg-gray-400';
  }

  getMapDot(status: string): string {
    const map: Record<string, string> = {
      'Available': 'bg-emerald-500',
      'Limited': 'bg-amber-500',
      'Full': 'bg-rose-500',
    };
    return map[status] ?? 'bg-gray-400';
  }

  openRegisterModal(): void {
    this.registerModalOpen = true;
  }

  closeRegisterModal(): void {
    this.registerModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newShelterName = '';
    this.newShelterAddress = '';
    this.newShelterCapacity = '';
    this.newShelterOccupied = '';
    this.newShelterAmenities = '';
  }

  registerShelterSubmit(): void {
    const name = this.newShelterName.trim();
    const address = this.newShelterAddress.trim();
    if (!name || !address) {
      alert('Please fill out Name and Address');
      return;
    }

    const capacityVal = parseInt(this.newShelterCapacity, 10) || 0;
    const occupiedVal = parseInt(this.newShelterOccupied, 10) || 0;

    if (capacityVal <= 0) {
      alert('Please enter a valid capacity');
      return;
    }

    const amenitiesList = this.newShelterAmenities
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const occupancyRate = (occupiedVal / capacityVal) * 100;
    let status: 'Available' | 'Limited' | 'Full' = 'Available';
    if (occupancyRate >= 100) {
      status = 'Full';
    } else if (occupancyRate >= 80) {
      status = 'Limited';
    }

    const nextId = `SH-${101 + this.shelters.length}`;

    this.shelters.unshift({
      id: nextId,
      name,
      address,
      capacity: capacityVal,
      occupied: occupiedVal,
      amenities: amenitiesList.length ? amenitiesList : ['Power', 'Water'],
      lastUpdated: 'Just now',
      status
    });

    this.closeRegisterModal();
  }
}
