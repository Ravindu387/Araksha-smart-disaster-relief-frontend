import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { ShelterService } from '../../../../services/shelter';
import { InventoryService } from '../../../../Common/services/inventory.service';
import { AllocationService, RecentAllocation } from '../../../../Common/services/allocation.service';
import { forkJoin } from 'rxjs';

interface Emergency {
  id: string;
  title: string;
  location: string;
  priority: string;
  resources: string[];
  status: string;
}

interface Volunteer {
  id?: number;
  name: string;
  skill: string;
  distance: string;
  eta: string;
  isBest?: boolean;
  matchScore?: number;
}

interface Shelter {
  id: number;
  name: string;
  distance: string;
  bedsFree: number;
}

interface ResourceItem {
  id: number;
  label: string;
  count: string;
}

@Component({
  selector: 'app-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './allocation.html',
  styleUrls: ['./allocation.css']
})
export class AllocationComponent implements OnInit {

  selectedEmergencyId = '';
  assigned = false;
  matching = false;
  assignSuccess = '';

  emergencies: Emergency[] = [];
  volunteers: Volunteer[] = [];
  shelters: Shelter[] = [];
  resources: ResourceItem[] = [];
  recentAllocations: RecentAllocation[] = [];

  private originalEmergencies: any[] = [];
  private originalVolunteers: any[] = [];
  private originalShelters: any[] = [];
  private originalInventory: any[] = [];

  constructor(
    private emergencyService: EmergencyRequestService,
    private volunteerService: VolunteerService,
    private shelterService: ShelterService,
    private inventoryService: InventoryService,
    private allocationService: AllocationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    forkJoin({
      emergencies: this.emergencyService.getAllRequests(),
      volunteers: this.volunteerService.getAllVolunteers(),
      shelters: this.shelterService.getShelters(),
      inventory: this.inventoryService.getAllInventory(),
      allocations: this.allocationService.getAllAllocations()
    }).subscribe({
      next: (res) => {
        this.originalEmergencies = res.emergencies;
        this.originalVolunteers = res.volunteers;
        this.originalShelters = res.shelters;
        this.originalInventory = res.inventory;

        // 1. Map Emergencies
        this.emergencies = res.emergencies.map((req: any) => {
          let status = 'Awaiting Assignment';
          if (req.status === 'Completed' || req.status === 'Resolved' || req.status === 'Assigned' || req.assignedVolunteer) {
            status = 'Assigned';
          }
          
          // Connect database needs (resources list) to emergency
          let resources = (req.resources || []).length > 0 ? req.resources : ['Supplies', 'Food Kits'];
          if ((req.resources || []).length === 0) {
            const type = (req.emergencyType || '').toLowerCase();
            if (type.includes('flood')) {
              resources = ['Water Rescue', 'Food Kits', 'Blankets'];
            } else if (type.includes('earthquake')) {
              resources = ['Medical', 'Search & Rescue'];
            } else if (type.includes('hurricane')) {
              resources = ['Evacuation', 'Tents', 'Food Kits'];
            }
          }

          return {
            id: req.requestId || `ER-${req.id.toString().padStart(4, '0')}`,
            title: `${req.emergencyType || 'General'} Emergency`,
            location: req.location || 'Unknown Location',
            priority: req.priority || 'Medium',
            resources,
            status
          };
        });

        // Auto-select first emergency if none selected
        if (this.emergencies.length > 0 && !this.selectedEmergencyId) {
          this.selectedEmergencyId = this.emergencies[0].id;
        }

        // 2. Map Volunteers
        this.volunteers = res.volunteers.map((v: any) => ({
          id: v.id,
          name: v.name,
          skill: (v.skills || []).join(' · ') || 'General Relief',
          distance: '2.5 mi',
          eta: 'ETA 10 min',
          isBest: v.rating >= 4.8
        }));

        // 3. Map Shelters
        this.shelters = res.shelters.map((s: any) => ({
          id: s.id,
          name: s.name,
          distance: '1.5 mi',
          bedsFree: s.capacity - s.occupied
        }));

        // 4. Map Inventory Resources
        this.resources = res.inventory.map((item: any) => ({
          id: item.id,
          label: `${item.name} (${item.unit})`,
          count: item.count.toLocaleString()
        }));

        // 5. Map Recent Allocations
        this.recentAllocations = [...res.allocations].reverse();

        // Force Angular change detection
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching allocation dashboard data:', err)
    });
  }

  get selectedEmergency(): Emergency | undefined {
    return this.emergencies.find(e => e.id === this.selectedEmergencyId);
  }

  get recommendedVolunteers(): Volunteer[] {
    const emergency = this.selectedEmergency;
    if (!emergency) return this.volunteers;

    return this.volunteers
      .map(v => {
        let score = 0;
        const volunteerSkills = v.skill.toLowerCase();

        emergency.resources.forEach(resName => {
          const reqRes = resName.toLowerCase();
          if (volunteerSkills.includes(reqRes) || reqRes.includes(volunteerSkills)) {
            score += 10;
          }
          if (reqRes.includes('medical') && (volunteerSkills.includes('medical') || volunteerSkills.includes('first aid'))) {
            score += 8;
          }
          if (reqRes.includes('rescue') && volunteerSkills.includes('rescue')) {
            score += 8;
          }
          if (reqRes.includes('food') || reqRes.includes('supplies') || reqRes.includes('blanket')) {
            if (volunteerSkills.includes('logistics')) {
              score += 5;
            }
          }
        });

        if (v.isBest) {
          score += 2;
        }

        return { ...v, matchScore: score };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .map((v, index) => ({
        ...v,
        // Mark top 2 highest matches with positive score as 'Best'
        isBest: (v.matchScore || 0) > 0 && index < 2
      }));
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
    const unassigned = this.originalEmergencies.filter(
      (e: any) => e.status !== 'Completed' && e.status !== 'Resolved' && e.status !== 'Assigned' && !e.assignedVolunteer
    );

    if (unassigned.length === 0) {
      this.assignSuccess = 'No pending emergencies to assign!';
      setTimeout(() => { this.assignSuccess = ''; }, 3000);
      return;
    }

    this.matching = true;
    
    // Assign available volunteers to each emergency request
    const updateObservables = unassigned.map((e: any, index: number) => {
      const vol = this.originalVolunteers[index % this.originalVolunteers.length];
      e.status = 'Assigned';
      if (vol) {
        e.assignedVolunteer = vol.name;
      }
      return this.emergencyService.updateRequest(e.id, e);
    });

    forkJoin(updateObservables).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: 'Auto-Assign completed: all pending emergencies allocated',
          time: this.getCurrentTimeString(),
          type: 'info'
        }).subscribe({
          next: () => {
            this.matching = false;
            this.assignSuccess = 'All pending emergencies auto-assigned successfully!';
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => {
        console.error(err);
        this.matching = false;
      }
    });
  }

  smartMatch(): void {
    const emergency = this.selectedEmergency;
    const original = this.originalEmergencies.find(
      x => (x.requestId || `ER-${x.id.toString().padStart(4, '0')}`) === this.selectedEmergencyId
    );

    if (!emergency || !original) return;

    this.matching = true;
    setTimeout(() => {
      // Find the best volunteer based on rating or skills matching
      const recommended = this.recommendedVolunteers;
      const bestVol = recommended.length > 0 ? recommended[0] : null;

      const volunteerName = bestVol ? bestVol.name : 'Lisa Chen';
      original.status = 'Assigned';
      original.assignedVolunteer = volunteerName;

      this.emergencyService.updateRequest(original.id, original).subscribe({
        next: () => {
          this.allocationService.createAllocation({
            message: `AI recommended ${volunteerName} assigned to ${emergency.id}`,
            time: this.getCurrentTimeString(),
            type: 'volunteer'
          }).subscribe({
            next: () => {
              this.matching = false;
              this.assignSuccess = `AI Smart Matching complete — ${volunteerName} recommended & assigned!`;
              this.loadAllData();
              setTimeout(() => { this.assignSuccess = ''; }, 4000);
            }
          });
        },
        error: (err: any) => {
          console.error(err);
          this.matching = false;
        }
      });
    }, 1500);
  }

  assignVolunteer(v: Volunteer): void {
    const emergency = this.selectedEmergency;
    const original = this.originalEmergencies.find(
      x => (x.requestId || `ER-${x.id.toString().padStart(4, '0')}`) === this.selectedEmergencyId
    );

    if (!emergency || !original) return;

    original.status = 'Assigned';
    original.assignedVolunteer = v.name;

    this.emergencyService.updateRequest(original.id, original).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${v.name} assigned to ${emergency.id} (${emergency.title})`,
          time: this.getCurrentTimeString(),
          type: 'volunteer'
        }).subscribe({
          next: () => {
            this.assignSuccess = `${v.name} has been successfully assigned to ${emergency.title} (${emergency.id})!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error assigning volunteer:', err)
    });
  }

  assignShelter(s: Shelter): void {
    const emergency = this.selectedEmergency;
    const originalShelter = this.originalShelters.find(x => x.id === s.id);

    if (!emergency || !originalShelter) return;

    if (originalShelter.occupied >= originalShelter.capacity) {
      alert('This shelter is already full!');
      return;
    }

    // Increment occupied beds in the database
    originalShelter.occupied++;

    this.shelterService.update(originalShelter.id, originalShelter).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${s.name} linked to response for ${emergency.id}`,
          time: this.getCurrentTimeString(),
          type: 'shelter'
        }).subscribe({
          next: () => {
            this.assignSuccess = `${s.name} linked as active relief shelter for ${emergency.title}!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error linking shelter:', err)
    });
  }

  dispatchResource(item: ResourceItem): void {
    const emergency = this.selectedEmergency;
    const originalItem = this.originalInventory.find(x => x.id === item.id);

    if (!emergency || !originalItem) return;

    const dispatchAmt = originalItem.count > 500 ? 200 : 50;
    if (originalItem.count < dispatchAmt) {
      alert('Insufficient stock to dispatch!');
      return;
    }

    // Decrement count and increment allocated
    originalItem.count -= dispatchAmt;
    originalItem.allocated += dispatchAmt;

    this.inventoryService.updateInventory(originalItem.id, originalItem).subscribe({
      next: () => {
        this.allocationService.createAllocation({
          message: `${originalItem.name} (${dispatchAmt} units) dispatched to ${emergency.id}`,
          time: this.getCurrentTimeString(),
          type: 'resource'
        }).subscribe({
          next: () => {
            this.assignSuccess = `Dispatched ${dispatchAmt} units of ${originalItem.name} to ${emergency.title}!`;
            this.loadAllData();
            setTimeout(() => { this.assignSuccess = ''; }, 4000);
          }
        });
      },
      error: (err: any) => console.error('Error dispatching resource:', err)
    });
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