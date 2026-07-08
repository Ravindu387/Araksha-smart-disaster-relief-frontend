import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SearchService } from '../../../../Common/services/search.service';


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
import { ReportsService, ApiReportsPageResponse, ApiVolunteer } from '../../../../Common/services/reports.service';


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
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {

  
  @ViewChild('trendsChart')   trendsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('breakdownChart') breakdownCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseChart') responseCanvas!: ElementRef<HTMLCanvasElement>;

  
  currentDashboard: string = 'Executive dashboard';
  adminName: string = 'Admin Kumar';
  activeTab: string = 'Last 30 Days';

 
  isLoading: boolean = false;

 
  stats: StatCard[] = [];
  disasters: DisasterCategory[] = [];
  volunteers: Volunteer[] = [];

 
  volSearchQuery: string = '';
  volRatingFilter: number = 0;
  volTasksFilter: number = 0;
  volSortField: 'tasks' | 'rating' | 'name' = 'tasks';
  rawVolunteers: Volunteer[] = [];

  
  private trendsChartInstance: Chart | null = null;
  private breakdownChartInstance: Chart | null = null;
  private responseChartInstance: Chart | null = null;

 
  private currentTrendsData: {
    flood: number[];
    fire: number[];
    hurricane: number[];
    earthquake: number[];
    medical: number[];
    other: number[];
    avgResponse: number[];
  } | null = null;

  
  private readonly tabToPeriod: Record<string, string> = {
    'Last 30 Days': 'LAST_30_DAYS',
    'Q2 2025':      'Q2_2025',
    'YTD 2025':     'YTD_2025'
  };

  
  private readonly typeToStyle: Record<string, { iconColor: string; bgColor: string }> = {
    incidents: { iconColor: 'text-rose-500',    bgColor: 'bg-rose-50'    },
    resolved:  { iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    volunteers:{ iconColor: 'text-blue-500',    bgColor: 'bg-blue-50'    },
    response:  { iconColor: 'text-purple-500',  bgColor: 'bg-purple-50'  }
  };

 
  private readonly categoryColors: Record<string, string> = {
    Flood:      'bg-blue-600',
    Hurricane:  'bg-purple-500',
    Fire:       'bg-rose-500',
    Earthquake: 'bg-amber-500',
    Medical:    'bg-emerald-500',
    Other:      'bg-slate-400'
  };

  
  private searchService = inject(SearchService);
  private subscriptions = new Subscription();

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

 

  ngOnInit(): void {
    
    this.loadDataForPeriod(this.activeTab);

   
    this.subscriptions.add(
      this.searchService.searchQuery$.subscribe((q: string) => {
        if (this.volSearchQuery !== q) {
          this.volSearchQuery = q;
          this.applyVolunteerFilter();
        }
      })
    );
  }

  ngAfterViewInit(): void {
   
  }

  ngOnDestroy(): void {
    
    this.trendsChartInstance?.destroy();
    this.breakdownChartInstance?.destroy();
    this.responseChartInstance?.destroy();
    this.subscriptions.unsubscribe();
  }


  
  
  setActiveTab(tab: string): void {
    if (this.activeTab === tab) return; 
    this.activeTab = tab;
    this.loadDataForPeriod(tab);
  }

  
  private loadDataForPeriod(tab: string): void {
    const period = this.tabToPeriod[tab] ?? 'LAST_30_DAYS';
    this.isLoading = true;

    this.subscriptions.add(
      this.reportsService.getReportsByPeriod(period).subscribe({
        next: (data: ApiReportsPageResponse) => {
          this.isLoading = false;

         
          this.currentDashboard = data.dashboardLabel;

         
          this.stats = data.stats.map(s => {
            const style = this.typeToStyle[s.type] ?? { iconColor: '', bgColor: '' };
            
            const isPos = (s as any).positive ?? s.isPositive ?? true;
            return {
              title:     s.title,
              value:     s.value,
              change:    s.change,
              isPositive: isPos,
              iconColor: style.iconColor,
              bgColor:   style.bgColor,
              type:      s.type as StatCard['type']
            };
          });

          
          this.disasters = this.mapDisasterCategories(data.disasters);

         
          this.rawVolunteers = data.volunteers.map((v: ApiVolunteer): Volunteer => ({
            rank:        v.rank,
            name:        v.name,
            avgResponse: `${v.avgResponseMinutes} min avg response`,
            tasks:       v.tasksCompleted,
            rating:      v.rating
          }));

          this.applyVolunteerFilter();

          
          this.currentTrendsData = {
            flood:       data.trends.flood.map(Number),
            fire:        data.trends.fire.map(Number),
            hurricane:   data.trends.hurricane.map(Number),
            earthquake:  data.trends.earthquake.map(Number),
            medical:     data.trends.medical ? data.trends.medical.map(Number) : [],
            other:       data.trends.other ? data.trends.other.map(Number) : [],
            avgResponse: data.trends.avgResponse.map(Number)
          };

          
          if (!this.trendsChartInstance) {
            
            setTimeout(() => {
              this.buildTrendsChart();
              this.buildBreakdownChart();
              this.buildResponseChart();
              this.cdr.detectChanges();
            }, 0);
          } else {
          
            this.updateCharts();
            this.cdr.detectChanges();
          }
        },

        error: (err) => {
          this.isLoading = false;
          console.error('[ReportsComponent] Failed to load reports data:', err);
          
        }
      })
    );
  }

  
  applyVolunteerFilter(): void {
    let filtered = [...this.rawVolunteers];

    
    const q = this.volSearchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(v => v.name.toLowerCase().includes(q));
    }

    
    if (this.volRatingFilter > 0) {
      filtered = filtered.filter(v => v.rating >= this.volRatingFilter);
    }

  
    if (this.volTasksFilter > 0) {
      filtered = filtered.filter(v => v.tasks >= this.volTasksFilter);
    }

    
    filtered.sort((a, b) => {
      if (this.volSortField === 'rating') {
        return b.rating - a.rating; 
      } else if (this.volSortField === 'name') {
        return a.name.localeCompare(b.name); 
      } else {
        return b.tasks - a.tasks; 
      }
    });

    this.volunteers = filtered;
  }


 
  private mapDisasterCategories(apiCategories: { name: string; count: number }[]): DisasterCategory[] {
    
    const maxCount = Math.max(...apiCategories.map(c => c.count), 1);

    return apiCategories.map(c => {
      // Calculate percentage relative to the largest category (not total)
      // This makes the bars relative to each other, which is better UX
      const percentage = Math.round((c.count / maxCount) * 100);
      const widthClass = `w-[${percentage}%]`;

      return {
        name:       c.name,
        count:      c.count,
        color:      this.categoryColors[c.name] ?? 'bg-slate-400',
        widthClass: widthClass
      };
    });
  }

 
  private updateCharts(): void {
    if (!this.currentTrendsData) return;

    if (this.trendsChartInstance) {
      this.trendsChartInstance.data.datasets[0].data = this.currentTrendsData.flood;
      this.trendsChartInstance.data.datasets[1].data = this.currentTrendsData.hurricane;  // index 1 = Hurricane
      this.trendsChartInstance.data.datasets[2].data = this.currentTrendsData.fire;        // index 2 = Fire
      this.trendsChartInstance.data.datasets[3].data = this.currentTrendsData.earthquake;
      this.trendsChartInstance.data.datasets[4].data = this.currentTrendsData.medical;
      this.trendsChartInstance.data.datasets[5].data = this.currentTrendsData.other;
      this.trendsChartInstance.update();
    }

    if (this.breakdownChartInstance) {
      this.breakdownChartInstance.data.datasets[0].data = this.disasters.map(d => d.count);
      this.breakdownChartInstance.update();
    }

    if (this.responseChartInstance) {
      this.responseChartInstance.data.datasets[0].data = this.currentTrendsData.avgResponse;
      this.responseChartInstance.update();
    }
  }

  
  private buildTrendsChart(): void {
    const ctx = this.trendsCanvas?.nativeElement.getContext('2d');
    if (!ctx || !this.currentTrendsData) return;

    const chartData: ChartData<'line'> = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Flood',
          data: this.currentTrendsData.flood,
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2563eb'
        },
        {
          label: 'Hurricane',
          data: this.currentTrendsData.hurricane,
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#a855f7'
        },
        {
          label: 'Fire',
          data: this.currentTrendsData.fire,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ef4444'
        },
        {
          label: 'Earthquake',
          data: this.currentTrendsData.earthquake,
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f59e0b'
        },
        {
          label: 'Medical',
          data: this.currentTrendsData.medical,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'Other',
          data: this.currentTrendsData.other,
          borderColor: '#94a3b8',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#94a3b8'
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
          bodyFont:  { family: 'Inter, sans-serif', size: 12 },
          callbacks: {
            title: (items) => items[0].label,
            label: (item)  => `${item.dataset.label}: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          grid:   { display: false },
          ticks:  { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' } },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 400,
          ticks: {
            stepSize: 100,
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
    const ctx = this.breakdownCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData: ChartData<'doughnut'> = {
      labels: ['Flood', 'Hurricane', 'Fire', 'Earthquake', 'Medical', 'Other'],
      datasets: [
        {
          data: this.disasters.map(d => d.count),
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
          bodyFont:  { family: 'Inter, sans-serif', size: 12 }
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
    const ctx = this.responseCanvas?.nativeElement.getContext('2d');
    if (!ctx || !this.currentTrendsData) return;

    const chartData: ChartData<'bar'> = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Avg Response',
          data: this.currentTrendsData.avgResponse,
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
          bodyFont:  { family: 'Inter, sans-serif', size: 12 },
          callbacks: {
            title: (items) => items[0].label,
            label: (item)  => `Avg Response: ${item.raw} min`
          }
        }
      },
      scales: {
        x: {
          grid:   { display: false },
          ticks:  { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' } },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 60,
          ticks: {
            stepSize: 15,
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

    
    this.stats.forEach(s => {
      rows.push(['Key Metric', s.title, `${s.value} (${s.change})`]);
    });

   
    this.disasters.forEach(d => {
      rows.push(['Disaster Category', d.name, d.count.toString()]);
    });

    
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