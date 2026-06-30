import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../../Common/services/inventory.service';
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

  constructor(
  private inventoryService: InventoryService,
  private cdr: ChangeDetectorRef
) {}

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

  inventoryItems: InventoryItem[] = [];

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
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Current Stock',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        data: [],
        label: 'Allocated Stock',
        backgroundColor: '#10b981',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        data: [],
        label: 'Min Threshold',
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
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: '#f1f5f9' },
        border: { display: false },
      },
    },
  };

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.loadInventory();
}

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
  loadInventory(): void {

  this.inventoryService.getAllInventory().subscribe({

    next: (data: any[]) => {

      this.inventoryItems = data.map(item => {

        const colors = this.getCategoryColors(item.category);

        const percentage =
          item.total > 0
            ? Math.round((item.count / item.total) * 100)
            : 0;

        return {

          id: String(item.id),

          name: item.name,

          category: item.category,

          count: Number(item.count).toLocaleString(),

          total: Number(item.total).toLocaleString(),

          unit: item.unit,

          percentage,

          trend: 'Updated',

          trendUp: true,

          allocated: Number(item.allocated).toLocaleString(),

          min: Number(item.minStock).toLocaleString(),

          lowStock: item.count < item.minStock,

          ringColor: colors.ring,

          dotColor: colors.dot,

          barColor: colors.bar

        };

      });

      this.applyFilter();
      
      this.cdr.detectChanges();


    },

    error: err => console.error(err)

  });

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
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart) return;

    const labels = this.filteredItems.map(item => item.name);
    const currentStock = this.filteredItems.map(item => Number(String(item.count || '').replace(/,/g, '')) || 0);
    const allocatedStock = this.filteredItems.map(item => Number(String(item.allocated || '').replace(/,/g, '')) || 0);
    const minThreshold = this.filteredItems.map(item => Number(String(item.min || '').replace(/,/g, '')) || 0);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = currentStock;
    this.chart.data.datasets[1].data = allocatedStock;
    this.chart.data.datasets[2].data = minThreshold;

    this.chart.update();
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
    this.updateChart();
  }

  syncInventory(): void {

    this.syncing = true;

    this.loadInventory();

    setTimeout(() => {

        this.syncing = false;

    },1000);

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

    const body = {

        name: this.newItemName,

        category: this.newItemCategory,

        count: Number(this.newItemCount),

        total: Number(this.newItemTotal),

        unit: this.newItemUnit,

        allocated: Number(this.newItemAllocated),

        minStock: Number(this.newItemMin)

    };

    this.inventoryService.addInventory(body).subscribe({

        next: () => {

            alert("Inventory Added Successfully");

            this.closeAddModal();

            this.loadInventory();

        },

        error: err => {

            console.error(err);

            alert("Failed to save inventory");

        }

    });

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