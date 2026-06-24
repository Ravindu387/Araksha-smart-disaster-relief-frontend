import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  ChartData,
  ChartOptions,
} from 'chart.js';


Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
export class Inventory {
}


export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  count: string;
  total: string;
  unit: string;
  percentage: number;
  trend: string;
  trendUp: boolean;
  allocated: string;
  min: string;
  lowStock: boolean;
  ringColor: string;
  dotColor: string;
  barColor: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
})
export class InventoryComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('inventoryChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  searchQuery = '';
  selectedCategory = 'All';
  syncing = false;

  categories: string[] = [
    'All', 'Food', 'Water', 'Medicine', 'Supplies', 'Shelter', 'Equipment', 'Hygiene',
  ];

  inventoryItems: InventoryItem[] = [
    {
      id: '1', name: 'Food Kits', category: 'Food',
      count: '8,420', total: '12,000', unit: 'kits', percentage: 70,
      trend: '12% this week', trendUp: true,
      ringColor: 'border-amber-500 text-amber-500',
      dotColor: 'bg-amber-500', barColor: 'bg-amber-500',
      allocated: '3,580', min: '3,000', lowStock: false,
    },
    {
      id: '2', name: 'Drinking Water', category: 'Water',
      count: '15,600', total: '25,000', unit: 'liters', percentage: 62,
      trend: '8% this week', trendUp: false,
      ringColor: 'border-blue-500 text-blue-500',
      dotColor: 'bg-blue-500', barColor: 'bg-blue-600',
      allocated: '9,400', min: '5,000', lowStock: false,
    },
    {
      id: '3', name: 'Medical Kits', category: 'Medicine',
      count: '1,240', total: '3,000', unit: 'kits', percentage: 41,
      trend: '15% this week', trendUp: false,
      ringColor: 'border-rose-500 text-rose-500',
      dotColor: 'bg-rose-500', barColor: 'bg-rose-500',
      allocated: '1,760', min: '1,500', lowStock: true,
    },
    {
      id: '4', name: 'Emergency Blankets', category: 'Supplies',
      count: '3,800', total: '8,000', unit: 'units', percentage: 48,
      trend: '5% this week', trendUp: true,
      ringColor: 'border-purple-600 text-purple-600',
      dotColor: 'bg-purple-600', barColor: 'bg-purple-600',
      allocated: '4,200', min: '1,500', lowStock: false,
    },
    {
      id: '5', name: 'Relief Tents', category: 'Shelter',
      count: '320', total: '600', unit: 'tents', percentage: 53,
      trend: '3% this week', trendUp: false,
      ringColor: 'border-emerald-500 text-emerald-500',
      dotColor: 'bg-emerald-500', barColor: 'bg-emerald-500',
      allocated: '280', min: '100', lowStock: false,
    },
    {
      id: '6', name: 'First Aid Supplies', category: 'Medicine',
      count: '580', total: '2,000', unit: 'boxes', percentage: 29,
      trend: '22% this week', trendUp: false,
      ringColor: 'border-rose-500 text-rose-500',
      dotColor: 'bg-rose-500', barColor: 'bg-rose-500',
      allocated: '1,420', min: '600', lowStock: true,
    },
    {
      id: '7', name: 'Flashlights & Batteries', category: 'Equipment',
      count: '2,100', total: '3,500', unit: 'sets', percentage: 60,
      trend: '8% this week', trendUp: true,
      ringColor: 'border-amber-500 text-amber-500',
      dotColor: 'bg-amber-500', barColor: 'bg-amber-500',
      allocated: '1,400', min: '700', lowStock: false,
    },
    {
      id: '8', name: 'Sanitation Kits', category: 'Hygiene',
      count: '410', total: '1,500', unit: 'kits', percentage: 27,
      trend: '18% this week', trendUp: false,
      ringColor: 'border-teal-500 text-teal-500',
      dotColor: 'bg-teal-500', barColor: 'bg-teal-500',
      allocated: '1,090', min: '300', lowStock: false,
    },
  ];

  filteredItems: InventoryItem[] = [];

  get lowStockItems(): InventoryItem[] {
    return this.inventoryItems.filter(i => i.lowStock);
  }

  get subtitle(): string {
    const low = this.lowStockItems.length;
    return `${this.inventoryItems.length} item categories • ${low} low stock alert${low !== 1 ? 's' : ''}`;
  }

  get lowStockNames(): string {
    return this.lowStockItems.map(i => i.name).join(', ');
  }

  
  
  private chartData: ChartData<'bar'> = {
    labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7'],
    datasets: [
      {
        data: [420, 380, 650, 820, 540, 720, 890],
        label: 'Dispatched',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        data: [800, 200, 500, 1200, 300, 600, 400],
        label: 'Restocked',
        backgroundColor: '#10b981',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        data: [380, 340, 610, 780, 510, 680, 840],
        label: 'Consumed',
        backgroundColor: '#f43f5e',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  private chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 1200,
        ticks: { stepSize: 300, color: '#94a3b8', font: { size: 11 } },
        grid: { color: '#f1f5f9' },
        border: { display: false },
      },
    },
  };

 
  ngOnInit(): void {
    this.filterCategory('All');
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    // Always destroy Chart.js instance to avoid canvas-reuse errors
    this.chart?.destroy();
  }

  private buildChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.chartData,
      options: this.chartOptions,
    });
  }

  filterCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = this.inventoryItems.filter(
      item =>
        (this.selectedCategory === 'All' || item.category === this.selectedCategory) &&
        (item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    );
  }

  syncInventory(): void {
    this.syncing = true;
    setTimeout(() => (this.syncing = false), 1400);
  }
}
