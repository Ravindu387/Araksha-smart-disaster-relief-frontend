import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../../Common/icon/icon';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { VolunteerService } from '../../../../Common/services/volunteer.service';
import { ShelterService } from '../../../../services/shelter';
import { InventoryService } from '../../../../Common/services/inventory.service';

interface StatCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  blob: string;
  value: string;
  label: string;
  trendIcon: 'trend-up' | 'trend-down';
  trendColor: string;
  trendLabel: string;
}

interface StatusSlice {
  label: string;
  value: number;
  color: string; // tailwind bg/text color token, e.g. 'emerald-500'
  hex: string; // matching hex for the SVG stroke
}

interface ResourceBar {
  label: string;
  percent: number;
  barColor: string;
}

interface ActivityItem {
  id: string;
  name: string;
  type: string;
  location: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityClass: string;
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Pending';
  statusClass: string;
  statusDot: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  constructor(
    private emergencyRequestService: EmergencyRequestService,
    private volunteerService: VolunteerService,
    private shelterService: ShelterService,
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  goToEmergencyRequests(): void {
    this.router.navigate(['/emergency-requests']);
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  private loadAllData(): void {
    // 1. Emergency Requests
    this.emergencyRequestService.getAllRequests().subscribe({
      next: (requests) => {
        this.stats[0].value = requests.length.toLocaleString();
        
        const activeCount = requests.filter(r => r.status !== 'Completed').length;
        this.stats[1].value = activeCount.toString();

        const todayStr = new Date().toDateString();
        const requestsToday = requests.filter(r => r.requestTime && new Date(r.requestTime).toDateString() === todayStr).length;
        this.stats[0].trendLabel = `+${requestsToday} today`;

        const pendingCount = requests.filter(r => r.status === 'Pending').length;
        this.stats[1].trendLabel = `${pendingCount} pending`;

        this.updateChartData(requests);
        this.updateStatusSlices(requests);
        this.updateRecentActivity(requests);
      },
      error: err => console.error('Error fetching emergency requests:', err)
    });

    // 2. Volunteers
    this.volunteerService.getAllVolunteers().subscribe({
      next: (volunteers) => {
        const onlineCount = volunteers.filter(v => v.status === 'Available' || v.status === 'On Duty').length;
        const totalCount = volunteers.length;
        this.stats[2].value = onlineCount.toLocaleString();
        this.stats[2].trendLabel = `${onlineCount} on duty / ${totalCount} total`;
      },
      error: err => console.error('Error fetching volunteers:', err)
    });

    // 3. Shelters
    this.shelterService.getShelters().subscribe({
      next: (shelters) => {
        const totalCapacity = shelters.reduce((sum: number, s: any) => sum + (s.capacity ?? 0), 0);
        const totalOccupied = shelters.reduce((sum: number, s: any) => sum + (s.occupied ?? 0), 0);
        const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
        
        this.stats[3].value = `${occupancyPercent}%`;
        this.stats[3].trendLabel = `${totalOccupied.toLocaleString()} / ${totalCapacity.toLocaleString()}`;
      },
      error: err => console.error('Error fetching shelters:', err)
    });

    // 4. Inventory
    this.inventoryService.getAllInventory().subscribe({
      next: (inventory) => {
        this.resourceBars = inventory.slice(0, 5).map(item => {
          const percent = item.total > 0 ? Math.round((item.allocated / item.total) * 100) : 0;
          let barColor = 'bg-blue-500';
          if (percent >= 80) {
            barColor = 'bg-rose-500';
          } else if (percent >= 50) {
            barColor = 'bg-amber-400';
          }
          return {
            label: item.name,
            percent,
            barColor
          };
        });
      },
      error: err => console.error('Error fetching inventory:', err)
    });
  }

  readonly today = new Date();

  readonly ranges = ['24h', '7d', '30d', '90d'];
  activeRange = '7d';

  setRange(range: string): void {
    this.activeRange = range;
  }

  stats: StatCard[] = [
    {
      icon: 'alert',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      blob: 'bg-rose-50',
      value: '0',
      label: 'Emergency Requests',
      trendIcon: 'trend-up',
      trendColor: 'text-rose-500',
      trendLabel: '0 today',
    },
    {
      icon: 'activity',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      blob: 'bg-amber-50',
      value: '0',
      label: 'Active Cases',
      trendIcon: 'trend-up',
      trendColor: 'text-emerald-600',
      trendLabel: '0 pending',
    },
    {
      icon: 'users',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      blob: 'bg-blue-50',
      value: '0',
      label: 'Volunteers Online',
      trendIcon: 'trend-down',
      trendColor: 'text-gray-400',
      trendLabel: '0 on duty',
    },
    {
      icon: 'pin',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      blob: 'bg-emerald-50',
      value: '0%',
      label: 'Shelter Occupancy',
      trendIcon: 'trend-down',
      trendColor: 'text-gray-400',
      trendLabel: '0 / 0',
    },
  ];

  // ---- Disaster Trends line chart ------------------------------------
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  yAxisTicks = [600, 450, 300, 150, 0];

  readonly chartWidth = 600;
  readonly chartHeight = 240;
  chartMax = 600;

  requestsData = [0, 0, 0, 0, 0, 0, 0];
  resolvedData = [0, 0, 0, 0, 0, 0, 0];

  hoveredIndex: number | null = null;

  onChartHover(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    this.hoveredIndex = Math.round(ratio * (this.months.length - 1));
  }

  onChartLeave(): void {
    this.hoveredIndex = null;
  }

  private valueToY(value: number): number {
    return this.chartHeight - (value / this.chartMax) * this.chartHeight;
  }

  get hoveredX(): number {
    if (this.hoveredIndex === null) return 0;
    return this.hoveredIndex * (this.chartWidth / (this.months.length - 1));
  }

  get hoveredRequestsY(): number {
    return this.hoveredIndex !== null ? this.valueToY(this.requestsData[this.hoveredIndex]) : 0;
  }

  get hoveredResolvedY(): number {
    return this.hoveredIndex !== null ? this.valueToY(this.resolvedData[this.hoveredIndex]) : 0;
  }

  get hoveredMonth(): string {
    return this.hoveredIndex !== null ? this.months[this.hoveredIndex] : '';
  }

  get hoveredRequests(): number {
    return this.hoveredIndex !== null ? this.requestsData[this.hoveredIndex] : 0;
  }

  get hoveredResolved(): number {
    return this.hoveredIndex !== null ? this.resolvedData[this.hoveredIndex] : 0;
  }

  /** Horizontal tooltip position as a %, clamped so the card never clips the card edges. */
  get tooltipLeftPercent(): number {
    if (this.hoveredIndex === null) return 0;
    const pct = (this.hoveredIndex / (this.months.length - 1)) * 100;
    return Math.min(88, Math.max(12, pct));
  }

  private toPoints(values: number[]): string {
    const step = this.chartWidth / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = this.valueToY(v);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  get requestsPoints(): string {
    return this.toPoints(this.requestsData);
  }

  get resolvedPoints(): string {
    return this.toPoints(this.resolvedData);
  }

  get requestsAreaPath(): string {
    return `M0,${this.chartHeight} L${this.requestsPoints} L${this.chartWidth},${this.chartHeight} Z`;
  }

  readonly chartViewBox = `0 0 600 240`;

  // ---- Request Status donut chart ------------------------------------
  statusSlices: StatusSlice[] = [
    { label: 'Resolved', value: 0, color: 'emerald-500', hex: '#10b981' },
    { label: 'In Progress', value: 0, color: 'blue-500', hex: '#3b82f6' },
    { label: 'Pending', value: 0, color: 'amber-500', hex: '#f59e0b' },
    { label: 'Assigned', value: 0, color: 'violet-500', hex: '#8b5cf6' },
  ];

  hoveredSlice: StatusSlice | null = null;

  readonly donutRadius = 68;
  readonly donutStroke = 22;
  get donutCircumference(): number {
    return 2 * Math.PI * this.donutRadius;
  }

  get totalRequests(): number {
    return this.statusSlices.reduce((sum, s) => sum + s.value, 0);
  }

  get donutSegments(): { slice: StatusSlice; dashArray: string; dashOffset: number }[] {
    const c = this.donutCircumference;
    const total = this.totalRequests;
    let cumulative = 0;
    return this.statusSlices.map((slice) => {
      const len = total > 0 ? (slice.value / total) * c : 0;
      const segment = {
        slice,
        dashArray: `${len.toFixed(2)} ${(c - len).toFixed(2)}`,
        dashOffset: -cumulative,
      };
      cumulative += len;
      return segment;
    });
  }

  // ---- Resource usage ---------------------------------------------------
  resourceBars: ResourceBar[] = [];

  // ---- Recent activity ----------------------------------------------------
  activity: ActivityItem[] = [];

  private updateChartData(requests: any[]): void {
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last7Months: { year: number; month: number; name: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last7Months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        name: monthsName[d.getMonth()]
      });
    }

    this.months = last7Months.map(m => m.name);

    const rData = [0, 0, 0, 0, 0, 0, 0];
    const resData = [0, 0, 0, 0, 0, 0, 0];

    requests.forEach(r => {
      if (!r.requestTime) return;
      const d = new Date(r.requestTime);
      const rYear = d.getFullYear();
      const rMonth = d.getMonth();

      const index = last7Months.findIndex(m => m.year === rYear && m.month === rMonth);
      if (index !== -1) {
        rData[index]++;
        if (r.status === 'Completed') {
          resData[index]++;
        }
      }
    });

    this.requestsData = rData;
    this.resolvedData = resData;

    const maxVal = Math.max(...rData, ...resData, 10);
    const roundedMax = Math.ceil(maxVal / 10) * 10;
    this.chartMax = roundedMax;
    
    const step = roundedMax / 4;
    this.yAxisTicks = [
      roundedMax,
      Math.round(roundedMax - step),
      Math.round(roundedMax - 2 * step),
      Math.round(roundedMax - 3 * step),
      0
    ];
  }

  private updateStatusSlices(requests: any[]): void {
    const counts: Record<string, number> = {
      'Resolved': 0,
      'In Progress': 0,
      'Pending': 0,
      'Assigned': 0
    };
    requests.forEach(r => {
      const statusKey = r.status === 'Completed' ? 'Resolved' : r.status;
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++;
      }
    });

    this.statusSlices = [
      { label: 'Resolved', value: counts['Resolved'], color: 'emerald-500', hex: '#10b981' },
      { label: 'In Progress', value: counts['In Progress'], color: 'blue-500', hex: '#3b82f6' },
      { label: 'Pending', value: counts['Pending'], color: 'amber-500', hex: '#f59e0b' },
      { label: 'Assigned', value: counts['Assigned'], color: 'violet-500', hex: '#8b5cf6' },
    ];
  }

  private updateRecentActivity(requests: any[]): void {
    const sortedRequests = [...requests].sort((a, b) => {
      const timeA = a.requestTime ? new Date(a.requestTime).getTime() : 0;
      const timeB = b.requestTime ? new Date(b.requestTime).getTime() : 0;
      return timeB - timeA;
    });

    this.activity = sortedRequests.slice(0, 5).map(r => this.mapRequestToActivity(r));
  }

  private mapRequestToActivity(r: any): ActivityItem {
    const priorityClassMap: Record<string, string> = {
      Critical: 'bg-rose-50 text-rose-600',
      High: 'bg-amber-50 text-amber-600',
      Medium: 'bg-yellow-50 text-yellow-700',
      Low: 'bg-emerald-50 text-emerald-600',
    };
    const statusClassMap: Record<string, string> = {
      Pending: 'bg-gray-100 text-gray-600',
      Assigned: 'bg-violet-50 text-violet-600',
      'In Progress': 'bg-blue-50 text-blue-600',
      Completed: 'bg-emerald-50 text-emerald-600',
      Resolved: 'bg-emerald-50 text-emerald-600',
    };
    const statusDotMap: Record<string, string> = {
      Pending: 'bg-gray-400',
      Assigned: 'bg-violet-500',
      'In Progress': 'bg-blue-500',
      Completed: 'bg-emerald-500',
      Resolved: 'bg-emerald-500',
    };

    const statusValue = r.status === 'Completed' ? 'Resolved' : r.status;

    return {
      id: `ER-${r.id.toString().padStart(4, '0')}`,
      name: r.citizenName || 'Unknown',
      type: r.emergencyType || 'General',
      location: r.location || 'Unknown',
      priority: (r.priority || 'Medium') as 'Critical' | 'High' | 'Medium' | 'Low',
      priorityClass: priorityClassMap[r.priority] || 'bg-yellow-50 text-yellow-700',
      status: statusValue as any,
      statusClass: statusClassMap[r.status] || 'bg-gray-100 text-gray-600',
      statusDot: statusDotMap[r.status] || 'bg-gray-400',
      time: this.getRelativeTime(r.requestTime),
    };
  }

  private getRelativeTime(timeStr: string): string {
    if (!timeStr) return 'Just now';
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
