import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

export interface InventoryItem {
  name: string;
  category: string;
  current: number;
  total: number;
  unit: string;
  trend: string;
  trendType: 'up' | 'down';
  allocated: number;
  min: number;
  colorClass: string;
  progressBarColor: string;
  percentage: number;
  lowStock?: boolean;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './index.html',
  styleUrl: './inventory.css'
})
export class Inventory implements AfterViewInit, OnDestroy {
  searchText: string = '';
  selectedCategory: string = 'All';

  categories: string[] = [
    'All',
    'Food',
    'Water',
    'Medicine',
    'Supplies',
    'Shelter',
    'Equipment',
    'Hygiene'
  ];

  items: InventoryItem[] = [
    {
      name: 'Food Kits',
      category: 'Food',
      current: 8420,
      total: 12000,
      unit: 'kits',
      trend: '12% this week',
      trendType: 'up',
      allocated: 3580,
      min: 3000,
      colorClass: 'text-amber-500',
      progressBarColor: 'bg-amber-500',
      percentage: 70
    },
    {
      name: 'Drinking Water',
      category: 'Water',
      current: 16600,
      total: 25000,
      unit: 'liters',
      trend: '8% this week',
      trendType: 'down',
      allocated: 9400,
      min: 5000,
      colorClass: 'text-blue-500',
      progressBarColor: 'bg-blue-500',
      percentage: 66
    },
    {
      name: 'Medical Kits',
      category: 'Medicine',
      current: 1240,
      total: 3000,
      unit: 'kits',
      trend: '15% this week',
      trendType: 'down',
      allocated: 1760,
      min: 1500,
      colorClass: 'text-rose-500',
      progressBarColor: 'bg-rose-500',
      percentage: 41,
      lowStock: true
    },
    {
      name: 'Emergency Blankets',
      category: 'Supplies',
      current: 3800,
      total: 8000,
      unit: 'units',
      trend: '5% this week',
      trendType: 'down',
      allocated: 4200,
      min: 1500,
      colorClass: 'text-purple-500',
      progressBarColor: 'bg-purple-500',
      percentage: 48
    },
    {
      name: 'Relief Tents',
      category: 'Shelter',
      current: 320,
      total: 600,
      unit: 'tents',
      trend: '3% this week',
      trendType: 'down',
      allocated: 280,
      min: 100,
      colorClass: 'text-emerald-500',
      progressBarColor: 'bg-emerald-500',
      percentage: 53
    },
    {
      name: 'First Aid Supplies',
      category: 'Medicine',
      current: 580,
      total: 2000,
      unit: 'boxes',
      trend: '22% this week',
      trendType: 'down',
      allocated: 1420,
      min: 600,
      colorClass: 'text-rose-500',
      progressBarColor: 'bg-rose-500',
      percentage: 29,
      lowStock: true
    },
    {
      name: 'Flashlights & Batteries',
      category: 'Equipment',
      current: 2100,
      total: 3500,
      unit: 'sets',
      trend: '8% this week',
      trendType: 'up',
      allocated: 1400,
      min: 700,
      colorClass: 'text-amber-500',
      progressBarColor: 'bg-amber-500',
      percentage: 60
    },
    {
      name: 'Sanitation Kits',
      category: 'Hygiene',
      current: 410,
      total: 1500,
      unit: 'kits',
      trend: '10% this week',
      trendType: 'down',
      allocated: 1090,
      min: 300,
      colorClass: 'text-emerald-500',
      progressBarColor: 'bg-emerald-500',
      percentage: 27
    }
  ];

  private movementChart: Chart | null = null;

  get filteredItems(): InventoryItem[] {
    return this.items.filter(item => {
      const matchesCategory = this.selectedCategory === 'All' || item.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
                            item.category.toLowerCase().includes(this.searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  get lowStockCount(): number {
    return this.items.filter(item => item.lowStock).length;
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.movementChart) {
      this.movementChart.destroy();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  syncInventory(): void {
    // Visual feedback for Sync button
    console.log('Syncing inventory data with server...');
  }

  addStock(): void {
    // Placeholder action for Add Stock button
    console.log('Opening Add Stock dialog...');
  }

  private initChart(): void {
    const ctx = document.getElementById('inventoryMovementChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.movementChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7'],
        datasets: [
          {
            label: 'Dispatched',
            data: [400, 380, 620, 800, 540, 740, 1100],
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          },
          {
            label: 'Restocked',
            data: [800, 200, 500, 1200, 300, 580, 380],
            backgroundColor: '#10b981',
            borderRadius: 6,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          },
          {
            label: 'Consumed',
            data: [380, 320, 580, 780, 520, 720, 1080],
            backgroundColor: '#ef4444',
            borderRadius: 6,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We use our custom legend in index.html to match design exactly
          },
          tooltip: {
            padding: 12,
            cornerRadius: 12,
            backgroundColor: '#0f172a'
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'inherit',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: '#f1f5f9'
            },
            border: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'inherit',
                size: 11
              },
              stepSize: 300
            },
            max: 1200
          }
        }
      }
    });
  }
}
