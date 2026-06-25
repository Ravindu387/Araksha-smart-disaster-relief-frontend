import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconColor: string;
  bgColor: string;
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
export class ReportsComponent implements OnInit {
  currentDashboard: string = 'Executive dashboard - June 2025';
  adminName: string = 'Admin Kumar';

  // Key Metrics
  stats: StatCard[] = [
    { title: 'Total Incidents', value: '1,284', change: '+18%', isPositive: true, iconColor: 'text-red-500', bgColor: 'bg-red-50' },
    { title: 'Resolved', value: '1,107', change: '+24%', isPositive: true, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { title: 'Volunteers Active', value: '247', change: '+11%', isPositive: true, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
    { title: 'Avg Response (min)', value: '13.2', change: '-28%', isPositive: false, iconColor: 'text-purple-500', bgColor: 'bg-purple-50' }
  ];

  // Disaster Category Breakdown Data
  disasters: DisasterCategory[] = [
    { name: 'Flood', count: 480, color: 'bg-blue-600', widthClass: 'w-[75%]' },
    { name: 'Medical', count: 243, color: 'bg-emerald-500', widthClass: 'w-[45%]' },
    { name: 'Fire', count: 182, color: 'bg-red-500', widthClass: 'w-[35%]' },
    { name: 'Hurricane', count: 149, color: 'bg-purple-500', widthClass: 'w-[28%]' },
    { name: 'Other', count: 132, color: 'bg-slate-400', widthClass: 'w-[25%]' },
    { name: 'Earthquake', count: 98, color: 'bg-amber-500', widthClass: 'w-[18%]' }
  ];

  // Top Volunteer Performance Data
  volunteers: Volunteer[] = [
    { rank: 1, name: 'Sarah Connor', avgResponse: '28 min avg response', tasks: 321, rating: 5.0 },
    { rank: 2, name: 'Michael Davis', avgResponse: '30 min avg response', tasks: 210, rating: 4.7 },
    { rank: 3, name: 'Anna Rodriguez', avgResponse: '35 min avg response', tasks: 185, rating: 4.9 },
    { rank: 4, name: 'James Wright', avgResponse: '32 min avg response', tasks: 142, rating: 4.9 },
    { rank: 5, name: 'Lisa Chen', avgResponse: '25 min avg response', tasks: 98, rating: 4.8 }
  ];

  // Chart placeholder variables for layout matching
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  responseTimes: { month: string; height: string }[] = [
    { month: 'Jan', height: 'h-[75px]' },
    { month: 'Feb', height: 'h-[110px]' },
    { month: 'Mar', height: 'h-[95px]' },
    { month: 'Apr', height: 'h-[130px]' },
    { month: 'May', height: 'h-[85px]' },
    { month: 'Jun', height: 'h-[70px]' }
  ];

  constructor() { }

  ngOnInit(): void { }
}