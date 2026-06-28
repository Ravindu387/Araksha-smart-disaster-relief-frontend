import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  ChartData,
  ChartOptions
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconColor: string;
  bgColor: string;
  type: 'incidents' | 'resolved' | 'volunteers' | 'response';
}

interface DisasterCategory {
  name: string;
  count: number;
  color: string;
  widthClass: string;
}

interface Volunteer {
  rank: number;
  name: string;
  avgResponse: string;
  tasks: number;
  rating: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendsChart') trendsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('breakdownChart') breakdownCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseChart') responseCanvas!: ElementRef<HTMLCanvasElement>;

  currentDashboard: string = 'Executive dashboard - June 2025';
  adminName: string = 'Admin Kumar';
  activeTab: string = 'Last 30 Days';

  private trendsChartInstance: Chart | null = null;
  private breakdownChartInstance: Chart | null = null;
  private responseChartInstance: Chart | null = null;

  stats: StatCard[] = [];
  disasters: DisasterCategory[] = [];

  volunteers: Volunteer[] = [
    { rank: 1, name: 'Sarah Connor', avgResponse: '28 min avg response', tasks: 321, rating: 5.0 },
    { rank: 2, name: 'Anna Rodriguez', avgResponse: '35 min avg response', tasks: 185, rating: 4.9 },
    { rank: 3, name: 'James Wright', avgResponse: '32 min avg response', tasks: 142, rating: 4.9 },
    { rank: 4, name: 'Michael Davis', avgResponse: '30 min avg response', tasks: 210, rating: 4.7 },
    { rank: 5, name: 'Lisa Chen', avgResponse: '25 min avg response', tasks: 98, rating: 4.8 }
  ];

  // Tab-specific data stores
  private readonly dataStore: Record<string, {
    dashboardLabel: string;
    stats: StatCard[];
    disasters: DisasterCategory[];
    trendsData: {
      flood: number[];
      fire: number[];
      hurricane: number[];
      earthquake: number[];
    };
    breakdownData: number[];
    responseData: number[];
  }> = {
    'Last 30 Days': {
      dashboardLabel: 'Executive dashboard - Last 30 Days',
      stats: [
        { title: 'Total Incidents', value: '142', change: '+8%', isPositive: true, iconColor: 'text-rose-500', bgColor: 'bg-rose-50', type: 'incidents' },
        { title: 'Resolved', value: '128', change: '+12%', isPositive: true, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50', type: 'resolved' },
        { title: 'Volunteers Active', value: '94', change: '+5%', isPositive: true, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', type: 'volunteers' },
        { title: 'Avg Response (min)', value: '11.8', change: '-15%', isPositive: false, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', type: 'response' }
      ],
      disasters: [
        { name: 'Flood', count: 55, color: 'bg-blue-600', widthClass: 'w-[39%]' },
        { name: 'Hurricane', count: 12, color: 'bg-purple-500', widthClass: 'w-[8%]' },
        { name: 'Fire', count: 28, color: 'bg-rose-500', widthClass: 'w-[20%]' },
        { name: 'Earthquake', count: 5, color: 'bg-amber-500', widthClass: 'w-[4%]' },
        { name: 'Medical', count: 32, color: 'bg-emerald-500', widthClass: 'w-[23%]' },
        { name: 'Other', count: 10, color: 'bg-slate-400', widthClass: 'w-[7%]' }
      ],
      trendsData: {
        flood: [20, 25, 45, 30, 50, 60],
        fire: [10, 8, 15, 20, 12, 18],
        hurricane: [5, 4, 10, 12, 8, 15],
        earthquake: [8, 12, 10, 5, 8, 12]
      },
      breakdownData: [55, 12, 28, 5, 32, 10],
      responseData: [8, 10, 12, 11, 9, 6]
    },
    'Q2 2025': {
      dashboardLabel: 'Executive dashboard - June 2025',
      stats: [
        { title: 'Total Incidents', value: '1,284', change: '+18%', isPositive: true, iconColor: 'text-rose-500', bgColor: 'bg-rose-50', type: 'incidents' },
        { title: 'Resolved', value: '1,107', change: '+24%', isPositive: true, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50', type: 'resolved' },
        { title: 'Volunteers Active', value: '247', change: '+11%', isPositive: true, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', type: 'volunteers' },
        { title: 'Avg Response (min)', value: '13.2', change: '-28%', isPositive: false, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', type: 'response' }
      ],
      disasters: [
        { name: 'Flood', count: 480, color: 'bg-blue-600', widthClass: 'w-[75%]' },
        { name: 'Hurricane', count: 149, color: 'bg-purple-500', widthClass: 'w-[28%]' },
        { name: 'Fire', count: 182, color: 'bg-rose-500', widthClass: 'w-[35%]' },
        { name: 'Earthquake', count: 98, color: 'bg-amber-500', widthClass: 'w-[18%]' },
        { name: 'Medical', count: 243, color: 'bg-emerald-500', widthClass: 'w-[45%]' },
        { name: 'Other', count: 132, color: 'bg-slate-400', widthClass: 'w-[25%]' }
      ],
      trendsData: {
        flood: [50, 62, 90, 72, 100, 120],
        fire: [22, 18, 34, 28, 42, 38],
        hurricane: [12, 8, 22, 35, 28, 44],
        earthquake: [8, 12, 15, 20, 18, 25]
      },
      breakdownData: [480, 149, 182, 98, 243, 132],
      responseData: [15, 13, 18, 14, 10, 9]
    },
    'YTD 2025': {
      dashboardLabel: 'Executive dashboard - Year-To-Date 2025',
      stats: [
        { title: 'Total Incidents', value: '3,450', change: '+22%', isPositive: true, iconColor: 'text-rose-500', bgColor: 'bg-rose-50', type: 'incidents' },
        { title: 'Resolved', value: '3,120', change: '+28%', isPositive: true, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50', type: 'resolved' },
        { title: 'Volunteers Active', value: '412', change: '+15%', isPositive: true, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', type: 'volunteers' },
        { title: 'Avg Response (min)', value: '12.5', change: '-32%', isPositive: false, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', type: 'response' }
      ],
      disasters: [
        { name: 'Flood', count: 1250, color: 'bg-blue-600', widthClass: 'w-[85%]' },
        { name: 'Hurricane', count: 410, color: 'bg-purple-500', widthClass: 'w-[32%]' },
        { name: 'Fire', count: 580, color: 'bg-rose-500', widthClass: 'w-[42%]' },
        { name: 'Earthquake', count: 210, color: 'bg-amber-500', widthClass: 'w-[20%]' },
        { name: 'Medical', count: 720, color: 'bg-emerald-500', widthClass: 'w-[52%]' },
        { name: 'Other', count: 280, color: 'bg-slate-400', widthClass: 'w-[22%]' }
      ],
      trendsData: {
        flood: [120, 150, 220, 190, 270, 310],
        fire: [60, 50, 80, 70, 95, 85],
        hurricane: [40, 30, 55, 75, 60, 90],
        earthquake: [30, 32, 45, 38, 35, 55]
      },
      breakdownData: [1250, 410, 580, 210, 720, 280],
      responseData: [18, 15, 20, 16, 12, 11]
    }
  };

  ngOnInit(): void {
    const selected = this.dataStore[this.activeTab];
    this.currentDashboard = selected.dashboardLabel;
    this.stats = selected.stats;
    this.disasters = selected.disasters;
  }

  ngAfterViewInit(): void {
    this.buildTrendsChart();
    this.buildBreakdownChart();
    this.buildResponseChart();
  }

  ngOnDestroy(): void {
    this.trendsChartInstance?.destroy();
    this.breakdownChartInstance?.destroy();
    this.responseChartInstance?.destroy();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    const selected = this.dataStore[this.activeTab];
    if (selected) {
      this.currentDashboard = selected.dashboardLabel;
      this.stats = selected.stats;
      this.disasters = selected.disasters;

      // Update Chart.js datasets dynamically
      if (this.trendsChartInstance) {
        this.trendsChartInstance.data.datasets[0].data = selected.trendsData.flood;
        this.trendsChartInstance.data.datasets[1].data = selected.trendsData.fire;
        this.trendsChartInstance.data.datasets[2].data = selected.trendsData.hurricane;
        this.trendsChartInstance.data.datasets[3].data = selected.trendsData.earthquake;
        this.trendsChartInstance.update();
      }

      if (this.breakdownChartInstance) {
        this.breakdownChartInstance.data.datasets[0].data = selected.breakdownData;
        this.breakdownChartInstance.update();
      }

      if (this.responseChartInstance) {
        this.responseChartInstance.data.datasets[0].data = selected.responseData;
        this.responseChartInstance.update();
      }
    }
  }

  private buildTrendsChart(): void {
    const ctx = this.trendsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const selected = this.dataStore[this.activeTab];

    const chartData: ChartData<'line'> = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Flood',
          data: selected.trendsData.flood,
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2563eb'
        },
        {
          label: 'Fire',
          data: selected.trendsData.fire,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ef4444'
        },
        {
          label: 'Hurricane',
          data: selected.trendsData.hurricane,
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#a855f7'
        },
        {
          label: 'Earthquake',
          data: selected.trendsData.earthquake,
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f59e0b'
        }
      ]
    };

    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#0f172a',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
          bodyFont: { family: 'Inter, sans-serif', size: 12 },
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `${item.dataset.label}: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' } },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 120,
          ticks: {
            stepSize: 30,
            color: '#94a3b8',
            font: { family: 'Inter, sans-serif', size: 11, weight: 'normal' }
          },
          grid: {
            color: '#f1f5f9',
            tickBorderDash: [4, 4]
          },
          border: { display: false }
        }
      }
    };

    this.trendsChartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
    });
  }

  private buildBreakdownChart(): void {
    const ctx = this.breakdownCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const selected = this.dataStore[this.activeTab];

    const chartData: ChartData<'doughnut'> = {
      labels: ['Flood', 'Hurricane', 'Fire', 'Earthquake', 'Medical', 'Other'],
      datasets: [
        {
          data: selected.breakdownData,
          backgroundColor: ['#2563eb', '#a855f7', '#ef4444', '#f59e0b', '#10b981', '#94a3b8'],
          borderWidth: 4,
          borderColor: '#ffffff',
          hoverOffset: 4
        }
      ]
    };

    const chartOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '78%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#0f172a',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
          bodyFont: { family: 'Inter, sans-serif', size: 12 }
        }
      }
    };

    this.breakdownChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: chartOptions
    });
  }

  private buildResponseChart(): void {
    const ctx = this.responseCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const selected = this.dataStore[this.activeTab];

    const chartData: ChartData<'bar'> = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Avg Response',
          data: selected.responseData,
          backgroundColor: '#2563eb',
          hoverBackgroundColor: '#1d4ed8',
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 32
        }
      ]
    };

    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#0f172a',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
          bodyFont: { family: 'Inter, sans-serif', size: 12 },
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `Avg Response: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' } },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 24,
          ticks: {
            stepSize: 6,
            color: '#94a3b8',
            font: { family: 'Inter, sans-serif', size: 11, weight: 'normal' },
            callback: (val) => `${val} min`
          },
          grid: {
            color: '#f1f5f9',
            tickBorderDash: [4, 4]
          },
          border: { display: false }
        }
      }
    };

    this.responseChartInstance = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    });
  }

  exportCsv(): void {
    const headers = ['Category/Dimension', 'Name/Metric', 'Value'];
    const rows: string[][] = [];

    // Add Key metrics
    this.stats.forEach(s => {
      rows.push(['Key Metric', s.title, `${s.value} (${s.change})`]);
    });

    // Add Disaster Categories
    this.disasters.forEach(d => {
      rows.push(['Disaster Category', d.name, d.count.toString()]);
    });

    // Add Top Volunteers
    this.volunteers.forEach(v => {
      rows.push(['Volunteer Performance', v.name, `${v.tasks} tasks | Rating ${v.rating} | ${v.avgResponse}`]);
    });

    const csvContent = [
      headers.join(','), 
      ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `executive_report_${this.activeTab.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPdf(): void {
    window.print();
  }
}