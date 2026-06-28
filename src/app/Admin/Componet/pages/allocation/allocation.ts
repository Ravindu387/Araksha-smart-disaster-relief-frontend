import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Emergency {
  id: string;
  title: string;
  location: string;
  priority: string;
  resources: string[];
  status: string;
}

interface Volunteer {
  name: string;
  skill: string;
  distance: string;
  eta: string;
  isBest?: boolean;
}

interface Shelter {
  name: string;
  distance: string;
  bedsFree: number;
}

interface ResourceItem {
  label: string;
  count: string;
}

interface RecentAllocation {
  id: number;
  message: string;
  time: string;
  type: 'volunteer' | 'resource' | 'shelter' | 'info';
}

@Component({
  selector: 'app-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './allocation.html',
  styleUrls: ['./allocation.css']
})
export class AllocationComponent {

  selectedEmergencyId = 'ER-2847';
  assigned = false;
  matching = false;
  assignSuccess = '';

  emergencies: Emergency[] = [
    {
      id: 'ER-2847',
      title: 'Flood Emergency',
      location: 'Houston, TX',
      priority: 'Critical',
      resources: ['Water Rescue', 'Food Kits', 'Blankets'],
      status: 'Awaiting Assignment'
    },
    {
      id: 'ER-2844',
      title: 'Earthquake Emergency',
      location: 'San Jose, CA',
      priority: 'Critical',
      resources: ['Medical', 'Search & Rescue'],
      status: 'Awaiting Assignment'
    },
    {
      id: 'ER-2843',
      title: 'Hurricane Emergency',
      location: 'Miami, FL',
      priority: 'High',
      resources: ['Evacuation', 'Tents', 'Food Kits'],
      status: 'Assigned'
    },
    {
      id: 'ER-2841',
      title: 'Flood Emergency',
      location: 'Phoenix, AZ',
      priority: 'Medium',
      resources: ['Evacuation', 'Water'],
      status: 'Awaiting Assignment'
    }
  ];

  volunteers: Volunteer[] = [
    { name: 'Lisa Chen',     skill: 'Medical · Logistics', distance: '2.1 mi', eta: 'ETA 8 min',  isBest: true  },
    { name: 'Michael Davis', skill: 'Search & Rescue',      distance: '3.4 mi', eta: 'ETA 12 min', isBest: false },
    { name: 'Sarah Connor',  skill: 'Medical · First Aid',  distance: '1.8 mi', eta: 'ETA 6 min',  isBest: false },
    { name: 'Diana Foster',  skill: 'Logistics',            distance: '4.2 mi', eta: 'ETA 15 min', isBest: false }
  ];

  shelters: Shelter[] = [
    { name: 'Houston Community Center', distance: '1.2 mi', bedsFree: 68 },
    { name: 'Denver Red Cross Hub',      distance: '3.8 mi', bedsFree: 220 },
    { name: 'Chicago Metro Shelter',    distance: '5.1 mi', bedsFree: 211 }
  ];

  resources: ResourceItem[] = [
    { label: 'Food Kits',     count: '8,420'  },
    { label: 'Water (Liters)', count: '15,600' },
    { label: 'Medical Kits',  count: '1,240'  }
  ];

  recentAllocations: RecentAllocation[] = [
    {
      id: 1,
      message: 'James Wright assigned to ER-2847 (Flood, Houston)',
      time: '14:38',
      type: 'volunteer'
    },
    {
      id: 2,
      message: 'Food Kits (200 units) dispatched to ER-2843 (Miami)',
      time: '14:22',
      type: 'resource'
    },
    {
      id: 3,
      message: 'SH-101 capacity increased — Houston Flood response',
      time: '14:05',
      type: 'shelter'
    },
    {
      id: 4,
      message: 'Medical team (3 volunteers) allocated to ER-2844',
      time: '13:48',
      type: 'volunteer'
    },
    {
      id: 5,
      message: 'Water supply (5,000L) dispatched from Phoenix depot',
      time: '13:30',
      type: 'resource'
    }
  ];

  get selectedEmergency(): Emergency | undefined {
    return this.emergencies.find(e => e.id === this.selectedEmergencyId);
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
    this.matching = true;
    setTimeout(() => {
      this.matching = false;
      this.emergencies.forEach(e => {
        if (e.status === 'Awaiting Assignment') {
          e.status = 'Assigned';
        }
      });
      this.assignSuccess = 'All pending emergencies auto-assigned successfully!';
      
      // Add a log to recent allocations
      this.recentAllocations.unshift({
        id: Date.now(),
        message: 'Auto-Assign completed: all pending emergencies allocated',
        time: this.getCurrentTimeString(),
        type: 'info'
      });

      setTimeout(() => { this.assignSuccess = ''; }, 4000);
    }, 1500);
  }

  smartMatch(): void {
    this.matching = true;
    setTimeout(() => {
      this.matching = false;
      
      // Update selected emergency status or volunteer assignments
      const emergency = this.selectedEmergency;
      if (emergency && emergency.status === 'Awaiting Assignment') {
        emergency.status = 'Assigned';
      }

      this.assignSuccess = 'AI Smart Matching complete — Lisa Chen recommended & assigned!';
      
      // Add a log to recent allocations
      this.recentAllocations.unshift({
        id: Date.now(),
        message: `AI recommended Lisa Chen assigned to ${emergency?.id ?? 'emergency'}`,
        time: this.getCurrentTimeString(),
        type: 'volunteer'
      });

      setTimeout(() => { this.assignSuccess = ''; }, 4000);
    }, 1500);
  }

  assignVolunteer(v: Volunteer): void {
    const emergency = this.selectedEmergency;
    if (!emergency) return;

    this.assignSuccess = `${v.name} has been successfully assigned to ${emergency.title} (${emergency.id})!`;
    emergency.status = 'Assigned';

    this.recentAllocations.unshift({
      id: Date.now(),
      message: `${v.name} assigned to ${emergency.id} (${emergency.title})`,
      time: this.getCurrentTimeString(),
      type: 'volunteer'
    });

    setTimeout(() => { this.assignSuccess = ''; }, 4000);
  }

  assignShelter(s: Shelter): void {
    const emergency = this.selectedEmergency;
    if (!emergency) return;

    this.assignSuccess = `${s.name} linked as active relief shelter for ${emergency.title}!`;
    
    // Decrement beds free just for visual interaction
    if (s.bedsFree > 0) {
      s.bedsFree--;
    }

    this.recentAllocations.unshift({
      id: Date.now(),
      message: `${s.name} linked to response for ${emergency.id}`,
      time: this.getCurrentTimeString(),
      type: 'shelter'
    });

    setTimeout(() => { this.assignSuccess = ''; }, 4000);
  }

  dispatchResource(item: ResourceItem): void {
    const emergency = this.selectedEmergency;
    if (!emergency) return;

    // Parse and decrement count for realistic action
    const currentVal = parseInt(item.count.replace(/,/g, ''), 10);
    const dispatchAmt = currentVal > 500 ? 200 : 50;
    if (currentVal >= dispatchAmt) {
      const newVal = currentVal - dispatchAmt;
      item.count = newVal.toLocaleString();
    }

    this.assignSuccess = `Dispatched ${dispatchAmt} units of ${item.label} to ${emergency.title}!`;

    this.recentAllocations.unshift({
      id: Date.now(),
      message: `${item.label} (${dispatchAmt} units) dispatched to ${emergency.id}`,
      time: this.getCurrentTimeString(),
      type: 'resource'
    });

    setTimeout(() => { this.assignSuccess = ''; }, 4000);
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