import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './volunteer-dashboard.html'
})


export class VolunteerDashboardComponent {


  // STAT CARDS
  stats = [

    {
      icon: '✓',
      value: 142,
      title: 'Tasks Completed',
      bg: 'bg-green-100'
    },

    {
      icon: '◷',
      value: 2,
      title: 'Active Tasks',
      bg: 'bg-blue-100'
    },

    {
      icon: '☆',
      value: 4.9,
      title: 'Citizen Rating',
      bg: 'bg-yellow-100'
    },

    {
      icon: '🏅',
      value: '2,840',
      title: 'Impact Score',
      bg: 'bg-purple-100'
    }

  ];





  // ASSIGNED TASKS

  tasks = [

    {
      id: 'ER-2847',
      name: 'Flood Emergency',
      location: 'Houston, TX',
      distance: '1.2 mi',
      eta: '8 min',
      priority: 'Critical',
      priorityColor: 'bg-red-100 text-red-500',
      active: true
    },


    {
      id: 'ER-2843',
      name: 'Hurricane Emergency',
      location: 'Miami, FL',
      distance: '4.5 mi',
      eta: '18 min',
      priority: 'High',
      priorityColor: 'bg-orange-100 text-orange-500',
      active: false
    }

  ];








  // NEARBY REQUESTS

  openRequests = [

    {
      id: 'ER-2849',
      priority: 'High',
      priorityClass:
        'text-orange-500 border-orange-200 bg-orange-50/30',

      description:
        'Elderly citizen needs medication access after road closure.',

      distance: '3.1 mi away'
    },


    {
      id: 'ER-2850',
      priority: 'Medium',

      priorityClass:
        'text-yellow-600 border-yellow-200 bg-yellow-50/30',

      description:
        'Family of 3 requesting evacuation assistance, non-critical.',

      distance: '5.4 mi away'
    }

  ];








  // NEEDS

  needs = [

    'Water Rescue',
    'Food',
    'Blankets'

  ];








  // COMPLETED TASKS

  completedTasks = [

    {
      id:'ER-2830',
      type:'Flood',
      date:'2025-06-05',
      stars:5
    },


    {
      id:'ER-2821',
      type:'Medical',
      date:'2025-06-04',
      stars:5
    }

  ];








  // WEEK CHART DATA

  weeklyData = [

    2,
    4,
    1,
    3,
    5,
    2,
    3

  ];



}