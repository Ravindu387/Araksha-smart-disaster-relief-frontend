import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-live-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-tracking.html',
  styleUrl: './live-tracking.css',
})
export class LiveTracking implements OnInit, OnDestroy {
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

  incidents = [
    { id: 'inc-1', title: 'Flash Flood', location: 'Colombo District', severity: 'Critical', x: 25, y: 35, time: '10 mins ago', status: 'Active', details: 'Heavy rain has caused street flooding. 50+ residents stranded. Dispatching relief packs.' },
    { id: 'inc-2', title: 'Landslide Blockage', location: 'Kandy - Kadugannawa', severity: 'Critical', x: 60, y: 30, time: '30 mins ago', status: 'Active', details: 'Main road blocked by landslide debris. Local teams working on clearing paths.' },
    { id: 'inc-3', title: 'Medical Support Needed', location: 'Galle Fort Area', severity: 'Moderate', x: 30, y: 70, time: '1 hr ago', status: 'Active', details: 'Elderly patients require urgent oxygen supply due to local power substation breakdown.' },
    { id: 'inc-4', title: 'Water Crisis', location: 'Jaffna Town', severity: 'Low', x: 75, y: 15, time: '2 hrs ago', status: 'Resolved', details: 'Water distribution trucks deployed to local centers. Issue now under control.' },
  ];

  volunteers = [
    { id: 'vol-1', name: 'John Doe', role: 'Rescue Lead', x: 28, y: 40, status: 'Active', targetIncidentId: 'inc-1', phone: '+94 77 123 4567', team: 'Sector A' },
    { id: 'vol-2', name: 'Sarah Connor', role: 'Medical Specialist', x: 55, y: 32, status: 'Active', targetIncidentId: 'inc-2', phone: '+94 77 987 6543', team: 'Sector B' },
    { id: 'vol-3', name: 'Michael Davis', role: 'Logistics Coord.', x: 68, y: 55, status: 'Standby', targetIncidentId: '', phone: '+94 76 555 4321', team: 'HQ' },
    { id: 'vol-4', name: 'Elena Rostova', role: 'First Responder', x: 34, y: 68, status: 'Active', targetIncidentId: 'inc-3', phone: '+94 72 444 8888', team: 'Sector C' },
    { id: 'vol-5', name: 'David Kim', role: 'Communications', x: 80, y: 22, status: 'Standby', targetIncidentId: '', phone: '+94 71 333 9999', team: 'Sector D' },
  ];

  shelters = [
    { id: 'she-1', name: 'Central Hall Shelter', location: 'Colombo 03', occupancy: 200, capacity: 250, x: 22, y: 45, status: 'Active', manager: 'Mr. Silva' },
    { id: 'she-2', name: 'Hillside Rescue Center', location: 'Kandy Town', occupancy: 90, capacity: 200, x: 50, y: 28, status: 'Active', manager: 'Mrs. Perera' },
    { id: 'she-3', name: 'Coastal Refuge', location: 'Galle Fort', occupancy: 120, capacity: 200, x: 35, y: 75, status: 'Active', manager: 'Mr. Fernando' },
    { id: 'she-4', name: 'North Relief Center', location: 'Jaffna District', occupancy: 40, capacity: 150, x: 82, y: 18, status: 'Active', manager: 'Mr. Kumar' },
  ];

  ngOnInit() {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 1000);
    this.startSimulation();
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
    this.stopSimulation();
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
    // Simulate volunteer movements towards their targets or drift randomly
    this.volunteers = this.volunteers.map(v => {
      let dx = (Math.random() - 0.5) * 1.5;
      let dy = (Math.random() - 0.5) * 1.5;

      if (v.targetIncidentId) {
        const target = this.incidents.find(i => i.id === v.targetIncidentId);
        if (target && target.status === 'Active') {
          // Calculate step towards the incident coordinates
          dx = (target.x - v.x) * 0.15 + (Math.random() - 0.5) * 0.5;
          dy = (target.y - v.y) * 0.15 + (Math.random() - 0.5) * 0.5;
        }
      }

      const newX = Math.max(10, Math.min(90, v.x + dx));
      const newY = Math.max(10, Math.min(90, v.y + dy));
      return { ...v, x: newX, y: newY };
    });
  }

  selectMarker(marker: any, type: string) {
    this.selectedMarker = { ...marker, markerType: type };
  }

  clearSelection() {
    this.selectedMarker = null;
  }

  locateMarker(id: string, type: string) {
    this.focusedMarkerId = id;
    const found = this.findMarkerById(id, type);
    if (found) {
      this.selectedMarker = { ...found, markerType: type };
    }
    setTimeout(() => {
      this.focusedMarkerId = null;
    }, 3000);
  }

  private findMarkerById(id: string, type: string) {
    if (type === 'Incident') return this.incidents.find(i => i.id === id);
    if (type === 'Volunteer') return this.volunteers.find(v => v.id === id);
    if (type === 'Shelter') return this.shelters.find(s => s.id === id);
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
    const newId = 'inc-' + (this.incidents.length + 1);
    const newInc = {
      id: newId,
      title: this.newIncidentTitle,
      location: this.newIncidentLocation,
      severity: this.newIncidentSeverity,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      time: 'Just now',
      status: 'Active',
      details: this.newIncidentDetails || 'Dispatch units requested immediately. Monitoring live feed.'
    };
    this.incidents.unshift(newInc);

    // Auto-assign first Standby volunteer to the new incident
    const standbyVol = this.volunteers.find(v => !v.targetIncidentId);
    if (standbyVol) {
      standbyVol.targetIncidentId = newId;
    }

    this.newIncidentTitle = '';
    this.newIncidentLocation = '';
    this.newIncidentDetails = '';
    this.showBroadcastForm = false;

    this.locateMarker(newId, 'Incident');
  }
}

