import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-allocation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allocation.component.html',
  styleUrls: ['./allocation.component.css']
})
export class AllocationComponent {

  emergencies = [
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
    }
  ];

  volunteers = [
    {
      name: 'Lisa Chen',
      skill: 'Medical · Logistics',
      eta: 'ETA 8 min'
    },
    {
      name: 'Michael Davis',
      skill: 'Search & Rescue',
      eta: 'ETA 12 min'
    },
    {
      name: 'Sarah Connor',
      skill: 'Medical · First Aid',
      eta: 'ETA 6 min'
    }
  ];

  autoAssign(): void {
    alert('Resources Assigned Successfully!');
  }

  smartMatch(): void {
    alert('AI Smart Matching Started!');
  }
}