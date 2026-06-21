import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../../Common/icon/icon';

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
  priority: 'Critical' | 'High' | 'Medium';
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
export class Dashboard {
  readonly today = new Date();

  readonly ranges = ['24h', '7d', '30d', '90d'];
  activeRange = '7d';

  setRange(range: string): void {
    this.activeRange = range;
  }

  readonly stats: StatCard[] = [
    {
      icon: 'alert',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      blob: 'bg-rose-50',
      value: '1,284',
      label: 'Emergency Requests',
      trendIcon: 'trend-up',
      trendColor: 'text-rose-500',
      trendLabel: '+18%',
    },
    {
      icon: 'activity',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      blob: 'bg-amber-50',
      value: '47',
      label: 'Active Cases',
      trendIcon: 'trend-up',
      trendColor: 'text-emerald-600',
      trendLabel: '+3 today',
    },
    {
      icon: 'users',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      blob: 'bg-blue-50',
      value: '2,847',
      label: 'Volunteers Online',
      trendIcon: 'trend-down',
      trendColor: 'text-gray-400',
      trendLabel: '124 on duty',
    },
    {
      icon: 'pin',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      blob: 'bg-emerald-50',
      value: '68%',
      label: 'Shelter Occupancy',
      trendIcon: 'trend-down',
      trendColor: 'text-gray-400',
      trendLabel: '4,100 / 6,020',
    },
  ];

  // ---- Disaster Trends line chart ------------------------------------
  readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  readonly yAxisTicks = [600, 450, 300, 150, 0];

  private readonly chartWidth = 600;
  private readonly chartHeight = 240;
  private readonly chartMax = 600;

  private readonly requestsData = [110, 175, 245, 305, 290, 330, 480];
  private readonly resolvedData = [95, 160, 230, 295, 280, 320, 460];

  private toPoints(values: number[]): string {
    const step = this.chartWidth / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = this.chartHeight - (v / this.chartMax) * this.chartHeight;
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
  readonly statusSlices: StatusSlice[] = [
    { label: 'Resolved', value: 780, color: 'emerald-500', hex: '#10b981' },
    { label: 'In Progress', value: 247, color: 'blue-500', hex: '#3b82f6' },
    { label: 'Pending', value: 142, color: 'amber-500', hex: '#f59e0b' },
    { label: 'Critical', value: 35, color: 'rose-500', hex: '#f43f5e' },
    { label: 'Cancelled', value: 80, color: 'slate-300', hex: '#cbd5e1' },
  ];

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
    let cumulative = 0;
    return this.statusSlices.map((slice) => {
      const len = (slice.value / this.totalRequests) * c;
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
  readonly resourceBars: ResourceBar[] = [
    { label: 'Food Kits', percent: 70, barColor: 'bg-amber-400' },
    { label: 'Water', percent: 72, barColor: 'bg-amber-400' },
    { label: 'Medicine', percent: 41, barColor: 'bg-blue-500' },
    { label: 'Blankets', percent: 90, barColor: 'bg-rose-500' },
    { label: 'Tents', percent: 53, barColor: 'bg-blue-500' },
  ];

  // ---- Recent activity ----------------------------------------------------
  readonly activity: ActivityItem[] = [
    {
      id: 'ER-2847',
      name: 'Maria Santos',
      type: 'Flood',
      location: 'Houston, TX',
      priority: 'Critical',
      priorityClass: 'bg-rose-50 text-rose-600',
      status: 'In Progress',
      statusClass: 'bg-blue-50 text-blue-600',
      statusDot: 'bg-blue-500',
      time: '12 min ago',
    },
    {
      id: 'ER-2846',
      name: 'Robert Kim',
      type: 'Fire',
      location: 'Los Angeles, CA',
      priority: 'High',
      priorityClass: 'bg-amber-50 text-amber-600',
      status: 'Assigned',
      statusClass: 'bg-violet-50 text-violet-600',
      statusDot: 'bg-violet-500',
      time: '28 min ago',
    },
    {
      id: 'ER-2845',
      name: 'Aisha Patel',
      type: 'Medical',
      location: 'Chicago, IL',
      priority: 'Medium',
      priorityClass: 'bg-yellow-50 text-yellow-700',
      status: 'Resolved',
      statusClass: 'bg-emerald-50 text-emerald-600',
      statusDot: 'bg-emerald-500',
      time: '1h ago',
    },
    {
      id: 'ER-2844',
      name: 'David Brown',
      type: 'Earthquake',
      location: 'San Jose, CA',
      priority: 'Critical',
      priorityClass: 'bg-rose-50 text-rose-600',
      status: 'Pending',
      statusClass: 'bg-gray-100 text-gray-600',
      statusDot: 'bg-gray-400',
      time: '1.5h ago',
    },
    {
      id: 'ER-2843',
      name: 'Emma Wilson',
      type: 'Hurricane',
      location: 'Miami, FL',
      priority: 'High',
      priorityClass: 'bg-amber-50 text-amber-600',
      status: 'In Progress',
      statusClass: 'bg-blue-50 text-blue-600',
      statusDot: 'bg-blue-500',
      time: '2h ago',
    },
  ];
}
