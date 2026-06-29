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
import { ReportsService, ApiReportsPageResponse, ApiVolunteer } from '../../../../Common/services/reports.service';

// ─────────────────────────────────────────────────────────────────────────────
// Register Chart.js modules (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// UI-only interfaces (these are the shapes the HTML template uses)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of each stat card as the HTML template expects it.
 * The backend sends raw values; this component adds the UI-only fields
 * (iconColor, bgColor) by computing them from the "type" field.
 */
interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconColor: string;   // UI-only — computed from type
  bgColor: string;     // UI-only — computed from type
  type: 'incidents' | 'resolved' | 'volunteers' | 'response';
}

/**
 * Shape of each disaster category row as the HTML template expects it.
 * The backend sends name + count; this component computes color + widthClass.
 */
interface DisasterCategory {
  name: string;
  count: number;
  color: string;       // UI-only Tailwind class — computed from name
  widthClass: string;  // UI-only Tailwind class — computed from count vs total
}

/**
 * Shape of each volunteer row as the HTML template expects it.
 * The backend sends avgResponseMinutes (integer); this component formats it.
 */
interface Volunteer {
  rank: number;
  name: string;
  avgResponse: string; // UI-only formatted string: "28 min avg response"
  tasks: number;
  rating: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── ViewChild references to the <canvas> elements in the HTML ─────────────
  @ViewChild('trendsChart')   trendsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('breakdownChart') breakdownCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseChart') responseCanvas!: ElementRef<HTMLCanvasElement>;

  // ── Component state ───────────────────────────────────────────────────────
  currentDashboard: string = 'Executive dashboard';
  adminName: string = 'Admin Kumar';
  activeTab: string = 'Last 30 Days';

  /** true while an API call is in progress — prevents chart builds on empty data */
  isLoading: boolean = false;

  // ── Data bound to the template ────────────────────────────────────────────
  stats: StatCard[] = [];
  disasters: DisasterCategory[] = [];
  volunteers: Volunteer[] = [];

  // ── Chart instances (kept so we can destroy/update them) ─────────────────
  private trendsChartInstance: Chart | null = null;
  private breakdownChartInstance: Chart | null = null;
  private responseChartInstance: Chart | null = null;

  /**
   * Cached raw trends data from the last API call.
   * Used to update charts when the user switches tabs.
   */
  private currentTrendsData: {
    flood: number[];
    fire: number[];
    hurricane: number[];
    earthquake: number[];
    avgResponse: number[];
  } | null = null;

  // ── Tab → backend period mapping ──────────────────────────────────────────
  /**
   * Maps the UI tab label (what the user sees) to the backend period string.
   * The backend switch() case reads this value.
   */
  private readonly tabToPeriod: Record<string, string> = {
    'Last 30 Days': 'LAST_30_DAYS',
    'Q2 2025':      'Q2_2025',
    'YTD 2025':     'YTD_2025'
  };

  // ── UI lookup maps (computed in Angular, NOT from backend) ────────────────

  /**
   * Maps the card "type" field to Tailwind CSS icon color and background color.
   * These are UI-only values. The backend does not send them.
   */
  private readonly typeToStyle: Record<string, { iconColor: string; bgColor: string }> = {
    incidents: { iconColor: 'text-rose-500',    bgColor: 'bg-rose-50'    },
    resolved:  { iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    volunteers:{ iconColor: 'text-blue-500',    bgColor: 'bg-blue-50'    },
    response:  { iconColor: 'text-purple-500',  bgColor: 'bg-purple-50'  }
  };

  /**
   * Maps disaster category names to their Tailwind color classes.
   * The backend sends the name (e.g. "Flood"); Angular picks the color.
   */
  private readonly categoryColors: Record<string, string> = {
    Flood:      'bg-blue-600',
    Hurricane:  'bg-purple-500',
    Fire:       'bg-rose-500',
    Earthquake: 'bg-amber-500',
    Medical:    'bg-emerald-500',
    Other:      'bg-slate-400'
  };

  // ─────────────────────────────────────────────────────────────────────────
  constructor(private reportsService: ReportsService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Load data for the default tab ("Last 30 Days") when the page opens
    this.loadDataForPeriod(this.activeTab);
  }

  ngAfterViewInit(): void {
    // Charts are built AFTER the view is ready and the canvases are available.
    // We wait until the first API response arrives before building charts —
    // see loadDataForPeriod() which calls buildAllCharts() after data arrives.
  }

  ngOnDestroy(): void {
    // Always destroy Chart.js instances when leaving the page to avoid memory leaks
    this.trendsChartInstance?.destroy();
    this.breakdownChartInstance?.destroy();
    this.responseChartInstance?.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC METHODS (called from the HTML template)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Called when the user clicks a date-filter tab button.
   * Updates the active tab state and fetches fresh data from the backend.
   */
  setActiveTab(tab: string): void {
    if (this.activeTab === tab) return; // No-op if already on this tab
    this.activeTab = tab;
    this.loadDataForPeriod(tab);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE: API + DATA MAPPING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calls the backend API for the selected tab period,
   * maps the response to UI models, and updates the page.
   *
   * Step-by-step:
   * 1. Convert tab label → backend period string
   * 2. Call ReportsService.getReportsByPeriod()
   * 3. On success: map API data → UI models → update template bindings
   * 4. Build or update charts
   */
  private loadDataForPeriod(tab: string): void {
    const period = this.tabToPeriod[tab] ?? 'LAST_30_DAYS';
    this.isLoading = true;

    this.reportsService.getReportsByPeriod(period).subscribe({
      next: (data: ApiReportsPageResponse) => {
        this.isLoading = false;

        // ── Update dashboard label ──────────────────────────────────────
        this.currentDashboard = data.dashboardLabel;

        // ── Map stat cards ──────────────────────────────────────────────
        // Backend sends: title, value, change, positive (boolean), type
        // We add:        iconColor, bgColor  (from typeToStyle map)
        this.stats = data.stats.map(s => {
          const style = this.typeToStyle[s.type] ?? { iconColor: '', bgColor: '' };
          // Jackson serializes boolean getters differently — handle both field names
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

        // ── Map disaster categories ─────────────────────────────────────
        // Backend sends: name, count
        // We add:        color (Tailwind class), widthClass (Tailwind % class)
        this.disasters = this.mapDisasterCategories(data.disasters);

        // ── Map volunteers ──────────────────────────────────────────────
        // Backend sends: rank, name, avgResponseMinutes, tasksCompleted, rating
        // We add:        avgResponse formatted string ("28 min avg response")
        this.volunteers = data.volunteers.map((v: ApiVolunteer): Volunteer => ({
          rank:        v.rank,
          name:        v.name,
          avgResponse: `${v.avgResponseMinutes} min avg response`,
          tasks:       v.tasksCompleted,
          rating:      v.rating
        }));

        // ── Cache trends for chart updates ─────────────────────────────
        this.currentTrendsData = {
          flood:       data.trends.flood.map(Number),
          fire:        data.trends.fire.map(Number),
          hurricane:   data.trends.hurricane.map(Number),
          earthquake:  data.trends.earthquake.map(Number),
          avgResponse: data.trends.avgResponse.map(Number)
        };

        // ── Build charts (first load) or update them (tab switch) ──────
        if (!this.trendsChartInstance) {
          // First time: build all three charts from scratch
          // Use setTimeout(0) to ensure Angular has finished rendering the DOM
          // (so the <canvas> elements are available via ViewChild)
          setTimeout(() => {
            this.buildTrendsChart();
            this.buildBreakdownChart();
            this.buildResponseChart();
          }, 0);
        } else {
          // Subsequent tab switches: just update the data in existing charts
          this.updateCharts();
        }
      },

      error: (err) => {
        this.isLoading = false;
        console.error('[ReportsComponent] Failed to load reports data:', err);
        // The UI stays with whatever data was previously shown
        // In production you would show an error toast/alert here
      }
    });
  }

  /**
   * Maps backend disaster categories to UI model objects.
   *
   * The Tailwind widthClass is computed by calculating each category's
   * percentage of the total incidents, then mapping to the nearest
   * percentage increment in the HTML template format (w-[XX%]).
   *
   * This keeps the progress bars proportional to real data.
   */
  private mapDisasterCategories(apiCategories: { name: string; count: number }[]): DisasterCategory[] {
    // Find the maximum count to use as reference for width scaling
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

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE: CHART BUILD METHODS (logic identical to original — data source changed)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Updates all three charts with the latest cached trends data.
   * Called on subsequent tab switches (charts already exist).
   */
  private updateCharts(): void {
    if (!this.currentTrendsData) return;

    if (this.trendsChartInstance) {
      this.trendsChartInstance.data.datasets[0].data = this.currentTrendsData.flood;
      this.trendsChartInstance.data.datasets[1].data = this.currentTrendsData.fire;
      this.trendsChartInstance.data.datasets[2].data = this.currentTrendsData.hurricane;
      this.trendsChartInstance.data.datasets[3].data = this.currentTrendsData.earthquake;
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

  /**
   * Builds the line chart (Emergency Trends by Type).
   * Chart configuration is identical to the original hardcoded version.
   */
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
          label: 'Earthquake',
          data: this.currentTrendsData.earthquake,
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

  /**
   * Builds the donut chart (Disaster Category Breakdown).
   * Chart configuration is identical to the original hardcoded version.
   */
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

  /**
   * Builds the bar chart (Avg Response Time Trend).
   * Chart configuration is identical to the original hardcoded version.
   */
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

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT METHODS (unchanged — they use the already-mapped arrays)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Exports the current page data as a CSV file.
   * Uses the same stats, disasters, and volunteers arrays
   * which are now populated from the backend.
   */
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