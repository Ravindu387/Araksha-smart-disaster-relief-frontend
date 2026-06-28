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

// ── Model class (used as the data shape for each inventory row) ──
export class InventoryItem {
  id: string = '';
  name: string = '';
  category: string = '';
  count: string = '';
  total: string = '';
  unit: string = '';
  percentage: number = 0;
  trend: string = '';
  trendUp: boolean = false;
  allocated: string = '';
  min: string = '';
  lowStock: boolean = false;
  ringColor: string = '';
  dotColor: string = '';
  barColor: string = '';
}

// ── Component class named "Inventory" so the spec can import { Inventory } ──
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('inventoryChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  searchQuery = '';
  selectedCategory = 'All';
  syncing = false;

  addModalOpen = false;

  newItemName = '';
  newItemCategory = 'Food';
  newItemCount = '';
  newItemTotal = '';
  newItemUnit = 'kits';
  newItemMin = '';
  newItemAllocated = '0';

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

  /* ── Getters ── */
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

  /* ── Chart config ── */
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

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.filterCategory('All');
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /* ── Chart init ── */
  private buildChart(): void {
    const ctx = this.chartCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.chartData,
      options: this.chartOptions,
    });
  }

  /* ── Filter / search ── */
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

  openAddModal(): void {
    this.addModalOpen = true;
  }

  closeAddModal(): void {
    this.addModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newItemName = '';
    this.newItemCategory = 'Food';
    this.newItemCount = '';
    this.newItemTotal = '';
    this.newItemUnit = 'kits';
    this.newItemMin = '';
    this.newItemAllocated = '0';
  }

  addStockSubmit(): void {
    const name = this.newItemName.trim();
    if (!name) {
      alert('Please enter a name');
      return;
    }

    const countVal = parseInt(this.newItemCount.replace(/,/g, ''), 10) || 0;
    const totalVal = parseInt(this.newItemTotal.replace(/,/g, ''), 10) || 0;
    const minVal = parseInt(this.newItemMin.replace(/,/g, ''), 10) || 0;
    const allocatedVal = parseInt(this.newItemAllocated.replace(/,/g, ''), 10) || 0;

    if (totalVal <= 0) {
      alert('Please enter a valid total capacity');
      return;
    }

    const percentage = Math.round((countVal / totalVal) * 100);
    const colors = this.getCategoryColors(this.newItemCategory);

    const nextId = (this.inventoryItems.length + 1).toString();

    this.inventoryItems.unshift({
      id: nextId,
      name: name,
      category: this.newItemCategory,
      count: countVal.toLocaleString(),
      total: totalVal.toLocaleString(),
      unit: this.newItemUnit,
      percentage: percentage,
      trend: 'New item',
      trendUp: true,
      allocated: allocatedVal.toLocaleString(),
      min: minVal.toLocaleString(),
      lowStock: countVal < minVal,
      ringColor: colors.ring,
      dotColor: colors.dot,
      barColor: colors.bar
    });

    this.applyFilter();
    this.closeAddModal();
  }

  private getCategoryColors(category: string) {
    switch (category) {
      case 'Food':
        return { ring: 'border-amber-500 text-amber-500', dot: 'bg-amber-500', bar: 'bg-amber-500' };
      case 'Water':
        return { ring: 'border-blue-500 text-blue-500', dot: 'bg-blue-500', bar: 'bg-blue-600' };
      case 'Medicine':
        return { ring: 'border-rose-500 text-rose-500', dot: 'bg-rose-500', bar: 'bg-rose-500' };
      case 'Supplies':
        return { ring: 'border-purple-600 text-purple-600', dot: 'bg-purple-600', bar: 'bg-purple-600' };
      case 'Shelter':
        return { ring: 'border-emerald-500 text-emerald-500', dot: 'bg-emerald-500', bar: 'bg-emerald-500' };
      case 'Equipment':
        return { ring: 'border-amber-500 text-amber-500', dot: 'bg-amber-500', bar: 'bg-amber-500' };
      case 'Hygiene':
        return { ring: 'border-teal-500 text-teal-500', dot: 'bg-teal-500', bar: 'bg-teal-500' };
      default:
        return { ring: 'border-slate-500 text-slate-500', dot: 'bg-slate-500', bar: 'bg-slate-500' };
    }
  }
}
