import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.ts'
})
export class Notification {

  notifications = [
    {
      title: 'Flood Alert',
      message: 'Heavy flood risk detected in Colombo District.',
      time: '2 minutes ago',
      type: 'danger',
      icon: '🚨'
    },
    {
      title: 'Resource Updated',
      message: 'Medical supplies inventory has been updated.',
      time: '15 minutes ago',
      type: 'success',
      icon: '✅'
    },
    {
      title: 'Volunteer Joined',
      message: 'New volunteer registered successfully.',
      time: '1 hour ago',
      type: 'info',
      icon: '👨‍🚒'
    },
    {
      title: 'Shelter Warning',
      message: 'Shelter A reached 90% capacity.',
      time: '3 hours ago',
      type: 'warning',
      icon: '⚠️'
    }
  ];

}