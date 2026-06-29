import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../Common/services/notification.service';

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

export type TabType =
  | 'all'
  | 'alerts'
  | 'assignments'
  | 'inventory'
  | 'shelters';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css'],
})
export class NotificationsComponent implements OnInit {

  constructor(
  private notificationService: NotificationService,
  private cdr: ChangeDetectorRef
) {}

  activeTab: TabType = 'all';

  tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'shelters', label: 'Shelters' },
  ];

  notifications: NotificationItem[] = [];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {

  this.notificationService.getNotifications().subscribe({

    next: (data: any[]) => {

      this.notifications = data.map((item) => ({

        id: item.id,

        category: item.category,

        severity: item.severity,

        title: item.title,

        badge: item.badge,

        desc: item.description,

        time: item.time,

        read: item.read,

      }));

      // Force Angular to refresh the view
      this.cdr.detectChanges();

    },

    error: (err) => {

      console.error('Failed to load notifications', err);

    }

  });

}

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getTabUnreadCount(tab: TabType): number {
    if (tab === 'all') {
      return this.notifications.filter((n) => !n.read).length;
    }

    return this.notifications.filter(
      (n) => n.category === tab && !n.read
    ).length;
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.activeTab === 'all') {
      return this.notifications;
    }

    return this.notifications.filter(
      (n) => n.category === this.activeTab
    );
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
      },
      error: (err) => console.error(err),
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          read: true,
        }));
      },
      error: (err) => console.error(err),
    });
  }

  getSeverityBarClass(severity: string): string {
    const map: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-400',
      info: 'bg-blue-500',
      success: 'bg-green-500',
    };

    return map[severity] ?? 'bg-gray-300';
  }

  getSeverityIconBg(severity: string): string {
    const map: Record<string, string> = {
      critical: 'bg-red-50 text-red-500',
      high: 'bg-orange-50 text-orange-400',
      info: 'bg-blue-50 text-blue-500',
      success: 'bg-green-50 text-green-500',
    };

    return map[severity] ?? 'bg-gray-100 text-gray-500';
  }

  getBadgeClass(severity: string): string {
    const map: Record<string, string> = {
      critical: 'text-red-600 bg-red-50 border border-red-200',
      high: 'text-orange-500 bg-orange-50 border border-orange-200',
      info: 'text-blue-600 bg-blue-50 border border-blue-200',
      success: 'text-green-600 bg-green-50 border border-green-200',
    };

    return map[severity] ?? 'text-gray-600 bg-gray-100';
  }
}