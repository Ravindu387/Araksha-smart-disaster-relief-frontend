import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { VolunteerHubService, TaskResponse } from '../../../Common/services/volunteerhub.service';
import { EmergencyRequest } from '../../../Common/models/emergency-request.model';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './volunteer-dashboard.html'
})
export class VolunteerDashboardComponent implements OnInit {

  private volunteerhubService = inject(VolunteerHubService);
  private location = inject(Location);

  volunteerDetails: any = null;

  volunteer = {
    name: 'Loading...',
    volunteerCode: '---',
    status: 'Offline'
  };

  // STAT CARDS
  stats = [
    {
      icon: '✓',
      value: '0',
      title: 'Tasks Completed',
      bg: 'bg-green-100'
    },
    {
      icon: '◷',
      value: '0',
      title: 'Active Tasks',
      bg: 'bg-blue-100'
    },
    {
      icon: '☆',
      value: '0.0',
      title: 'Citizen Rating',
      bg: 'bg-yellow-100'
    },
    {
      icon: '🏅',
      value: '0',
      title: 'Impact Score',
      bg: 'bg-purple-100'
    }
  ];

  // ASSIGNED TASKS
  tasks: any[] = [];

  // NEARBY REQUESTS
  openRequests: any[] = [];

  // NEEDS
  needs: string[] = ['Water Rescue', 'Food', 'Blankets'];

  // COMPLETED TASKS
  completedTasks: any[] = [];

  // WEEK CHART DATA
  weeklyData = [0, 0, 0, 0, 0, 0, 0];

  // SELECTED TASK FOR ROUTE & ASSESSMENT
  selectedTask: any = null;

  // PROFILE POPUP
  showProfile = false;

  openProfile(): void {
    this.showProfile = true;
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const email = localStorage.getItem('email') || 'volunteer@araksha.com';
    this.volunteerhubService.getVolunteerByEmail(email).subscribe({
      next: (res: any) => {
        this.volunteerDetails = res;
        this.volunteer = {
          name: res.name,
          volunteerCode: res.volunteerCode,
          status: res.status
        };
        this.loadTasks(res.id);
        this.loadOpenRequests();
      },
      error: (err: any) => {
        console.error('Error fetching volunteer details:', err);
      }
    });
  }

  loadTasks(volunteerId: number): void {
    this.volunteerhubService.getAllEmergencyRequests().subscribe({
      next: (requests: EmergencyRequest[]) => {
        this.volunteerhubService.getTasksForVolunteer(volunteerId).subscribe({
          next: (res: TaskResponse[]) => {
            const active = res.filter(t => t.status !== 'COMPLETED');
            const completed = res.filter(t => t.status === 'COMPLETED');

            this.tasks = active.map(t => {
              const matchedReq = requests.find(r => r.requestId === t.taskCode);
              return {
                id: t.id,
                taskCode: t.taskCode,
                name: t.name,
                location: t.location,
                distance: t.distance || '1.0 mi',
                eta: t.eta || '10 min',
                priority: t.priority || 'Medium',
                priorityColor: this.getPriorityColor(t.priority),
                active: true,
                citizenName: matchedReq?.citizenName || 'Alice Smith',
                contact: matchedReq?.requestTime ? '+1 713 555 0192' : '000-000-0000'
              };
            });

            this.completedTasks = completed.map(t => ({
              id: t.taskCode,
              type: t.name.replace(' Emergency', '').replace(' Rescue', ''),
              date: new Date().toISOString().split('T')[0],
              stars: 5
            }));

            // Select the first active task as default for route view if none selected
            if (this.tasks.length > 0) {
              if (!this.selectedTask || !this.tasks.some(t => t.id === this.selectedTask.id)) {
                this.selectTask(this.tasks[0]);
              }
            } else {
              this.selectedTask = null;
            }

            // Update Stats
            this.stats[0].value = completed.length.toString();
            this.stats[1].value = active.length.toString();
            this.stats[2].value = '0.0';
            this.stats[3].value = (completed.length * 150).toLocaleString();

            // Populate weekly chart mock data dynamically based on completed count
            this.weeklyData = [
              Math.max(0, completed.length - 2),
              Math.max(0, completed.length - 1),
              completed.length,
              Math.max(0, completed.length - 3),
              Math.max(0, completed.length - 2),
              Math.max(0, completed.length - 1),
              completed.length
            ];
          },
          error: (err: any) => {
            console.error('Error fetching volunteer tasks:', err);
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching emergency requests for enrichment:', err);
      }
    });
  }

  loadOpenRequests(): void {
    this.volunteerhubService.getAllEmergencyRequests().subscribe({
      next: (res: EmergencyRequest[]) => {
        // Filter requests where status is Pending or OPEN, and not assigned to anyone
        const open = res.filter(r => 
          r.status === 'Pending' && 
          (!r.assignedVolunteer || r.assignedVolunteer.trim() === '')
        );

        this.openRequests = open.map(r => ({
          id: r.id, // Database ID
          requestCode: r.requestId, // e.g. ER-2849
          priority: r.priority || 'Medium',
          priorityClass: this.getPriorityClass(r.priority),
          description: `${r.emergencyType || 'General'} assistance requested at ${r.location}.`,
          distance: (1.5 + Math.random() * 4.0).toFixed(1) + ' mi away',
          rawRequest: r
        }));
      },
      error: (err: any) => {
        console.error('Error fetching open emergency requests:', err);
      }
    });
  }

  selectTask(task: any): void {
    this.selectedTask = task;
    // Derive assessment needs dynamically based on emergency type
    if (task.name.toLowerCase().includes('flood')) {
      this.needs = ['Water Rescue', 'Food Supplies', 'Blankets', 'Life Jackets'];
    } else if (task.name.toLowerCase().includes('fire')) {
      this.needs = ['Fire Extinguisher', 'First Aid', 'Oxygen Mask', 'Blankets'];
    } else if (task.name.toLowerCase().includes('medical')) {
      this.needs = ['First Aid Kit', 'Stretchers', 'Emergency Meds'];
    } else {
      this.needs = ['Water Rescue', 'Food', 'Blankets'];
    }
  }

  acceptRequest(request: any): void {
    if (!this.volunteerDetails) return;

    const rawReq = request.rawRequest;
    const taskRequest = {
      taskCode: rawReq.requestId,
      name: (rawReq.emergencyType || 'General') + ' Rescue',
      location: rawReq.location,
      distance: request.distance.replace(' away', ''),
      eta: Math.floor(8 + Math.random() * 15) + ' min',
      priority: rawReq.priority || 'Medium',
      status: 'ACTIVE',
      volunteerId: this.volunteerDetails.id,
      emergencyRequestId: rawReq.id
    };

    this.volunteerhubService.assignRequestToVolunteer(taskRequest).subscribe({
      next: () => {
        console.log('Task successfully created and request assigned.');
        this.loadDashboard();
      },
      error: (err: any) => {
        console.error('Error assigning request to volunteer:', err);
      }
    });
  }

  completeTask(taskId: number): void {
    this.volunteerhubService.completeTask(taskId).subscribe({
      next: () => {
        console.log('Task completed.');
        this.loadDashboard();
      },
      error: (err: any) => {
        console.error('Error completing task:', err);
      }
    });
  }

  private getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-500';
      case 'high': return 'bg-orange-100 text-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-blue-100 text-blue-500';
    }
  }

  private getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-orange-500 border border-orange-200 bg-orange-50/30';
      case 'medium':
        return 'text-yellow-600 border border-yellow-200 bg-yellow-50/30';
      default:
        return 'text-blue-500 border border-blue-200 bg-blue-50/30';
    }
  }
}