import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationItem {
  id: number;
  category: 'alerts' | 'assignments' | 'inventory' | 'shelters';
  severity: 'critical' | 'high' | 'info' | 'success';
  title: string;
  badge: string;
  desc: string;
  time: string;
  read: boolean;
}

export type TabType = 'all' | 'alerts' | 'assignments' | 'inventory' | 'shelters';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css'],
})
export class NotificationsComponent {
  activeTab: TabType = 'all';

  tabs: { key: TabType; label: string }[] = [
    { key: 'all',         label: 'All'         },
    { key: 'alerts',      label: 'Alerts'      },
    { key: 'assignments', label: 'Assignments' },
    { key: 'inventory',   label: 'Inventory'   },
    { key: 'shelters',    label: 'Shelters'    },
  ];

  notifications: NotificationItem[] = [
    {
      id: 1,
      category: 'alerts',
      severity: 'critical',
      title: 'Category 4 Hurricane Alert',
      badge: 'Critical',
      desc: 'Hurricane Helena upgraded to Category 4. Expected landfall Florida Keys in 6 hours. Activate evacuation protocols immediately.',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      category: 'alerts',
      severity: 'high',
      title: 'Flash Flood Warning — Houston',
      badge: 'High',
      desc: 'National Weather Service issued flash flood warning for Harris County. 12 active requests in affected zone.',
      time: '18 min ago',
      read: false,
    },
    {
      id: 3,
      category: 'assignments',
      severity: 'info',
      title: 'Volunteer Assignment Confirmed',
      badge: 'Info',
      desc: 'James Wright (V-1024) assigned to ER-2847 (Flood, Houston TX). ETA: 8 minutes.',
      time: '38 min ago',
      read: false,
    },
    {
      id: 4,
      category: 'assignments',
      severity: 'success',
      title: 'Task Completed',
      badge: 'Success',
      desc: 'Anna Rodriguez marked ER-2843 complete. 3 citizens evacuated to SH-104 Miami-Dade Center.',
      time: '1h ago',
      read: true,
    },
    {
      id: 5,
      category: 'inventory',
      severity: 'critical',
      title: 'Critical Stock Alert: Medical Kits',
      badge: 'Critical',
      desc: 'Medical Kits stock at 1,240 units — below the 1,500 threshold. Immediate restocking required.',
      time: '45 min ago',
      read: false,
    },
    {
      id: 6,
      category: 'inventory',
      severity: 'high',
      title: 'Low Stock: First Aid Supplies',
      badge: 'High',
      desc: 'First Aid Supplies at 580 boxes (29%). Recommend dispatching resupply from Phoenix warehouse.',
      time: '1.5h ago',
      read: false,
    },
    {
      id: 8,
      category: 'shelters',
      severity: 'critical',
      title: 'Shelter At Capacity: Miami Dade',
      badge: 'Critical',
      desc: 'SH-104 Miami-Dade Evacuation Center has reached 99% occupancy (1,190/1,200). Overflow protocol activated.',
      time: '12 min ago',
      read: false,
    },
    {
      id: 9,
      category: 'shelters',
      severity: 'success',
      title: 'Shelter Capacity Increased',
      badge: 'Success',
      desc: 'Chicago Metro Shelter opened 50 additional beds. New capacity: 350. Available beds: 261.',
      time: '1h ago',
      read: true,
    },
    {
      id: 7,
      category: 'alerts',
      severity: 'high',
      title: 'Earthquake Aftershock Warning',
      badge: 'High',
      desc: 'USGS reports 4.2 magnitude aftershock near San Jose CA. Volunteers at ER-2844 alerted.',
      time: '3h ago',
      read: true,
    },
  ];

  
  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }


  getTabUnreadCount(tab: TabType): number {
    if (tab === 'all') return this.notifications.filter((n) => !n.read).length;
    return this.notifications.filter((n) => n.category === tab && !n.read).length;
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.activeTab === 'all') return this.notifications;
    return this.notifications.filter((n) => n.category === this.activeTab);
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  markAsRead(id: number): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  getSeverityBarClass(severity: string): string {
    const map: Record<string, string> = {
      critical: 'bg-red-500',
      high:     'bg-orange-400',
      info:     'bg-blue-500',
      success:  'bg-green-500',
    };
    return map[severity] ?? 'bg-gray-300';
  }

  getSeverityIconBg(severity: string): string {
    const map: Record<string, string> = {
      critical: 'bg-red-50 text-red-500',
      high:     'bg-orange-50 text-orange-400',
      info:     'bg-blue-50 text-blue-500',
      success:  'bg-green-50 text-green-500',
    };
    return map[severity] ?? 'bg-gray-100 text-gray-500';
  }

  getBadgeClass(severity: string): string {
    const map: Record<string, string> = {
      critical: 'text-red-600 bg-red-50 border border-red-200',
      high:     'text-orange-500 bg-orange-50 border border-orange-200',
      info:     'text-blue-600 bg-blue-50 border border-blue-200',
      success:  'text-green-600 bg-green-50 border border-green-200',
    };
    return map[severity] ?? 'text-gray-600 bg-gray-100';
  }
}