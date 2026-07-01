import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { Icon } from '../../../../Common/icon/icon';
import { EmergencyRequestService } from '../../../../Common/services/emergency-request.service';
import { NotificationService } from '../../../../Common/services/notification.service';
import { SettingsService } from '../../../../Common/services/settings.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  @Input() open = false;
  @Output() closeSidebar = new EventEmitter<void>();

  activeIncidents = 0;
  criticalPriority = 0;

  private emergencyService = inject(EmergencyRequestService);
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private pollingSub?: Subscription;

  adminName = 'Admin Kumar';
  adminRole = 'System Admin';
  adminInitials = 'AK';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCounts();
    this.loadAdminProfile();
    this.pollingSub = interval(5000).subscribe(() => {
      this.loadCounts();
      this.loadAdminProfile();
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  loadCounts(): void {
    this.emergencyService.getAllRequests().subscribe({
      next: (requests) => {
        this.activeIncidents = requests.filter(r => r.status !== 'Completed').length;
        this.criticalPriority = requests.filter(r => r.priority === 'Critical' && r.status !== 'Completed').length;
        
        // Update nav item badge dynamically for Emergency Requests
        const reqItem = this.navGroups[1].items.find(i => i.label === 'Emergency Requests');
        if (reqItem) {
          reqItem.badge = this.activeIncidents;
        }

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching sidebar incident counts:', err)
    });

    // Load unread notification count
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        const unreadCount = notifications.filter(n => !n.read).length;
        const notifItem = this.navGroups[3].items.find(i => i.label === 'Notifications');
        if (notifItem) {
          notifItem.badge = unreadCount;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching notification count:', err)
    });
  }

  loadAdminProfile(): void {
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        if (data) {
          const first = data.firstName || 'Admin';
          const last = data.lastName || 'Kumar';
          this.adminName = `${first} ${last}`;
          this.adminRole = data.jobTitle || 'System Admin';
          this.adminInitials = (first.charAt(0) + (last ? last.charAt(0) : '')).toUpperCase();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading admin profile in sidebar:', err)
    });
  }

  logout(): void {
    this.router.navigate(['/LandingPage']);
  }

  close(): void {
    this.closeSidebar.emit();
  }

  readonly navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', route: '/dashboard', icon: 'grid' }],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Emergency Requests', route: '/emergency-requests', badge: 0, icon: 'alert' },
        { label: 'Volunteers', route: '/volunteers', icon: 'users' },
        { label: 'Shelters', route: '/shelters', icon: 'pin' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { label: 'Inventory', route: '/inventory', icon: 'box' },
        { label: 'Allocation', route: '/allocation', icon: 'truck' },
      ],
    },
    {
      title: 'Monitoring',
      items: [
        { label: 'Live Tracking', route: '/live-tracking', icon: 'map' },
        { label: 'Notifications', route: '/notifications', badge: 0, icon: 'bell' },
        { label: 'Reports', route: '/reports', icon: 'chart' },
      ],
    },
    {
      title: 'System',
      items: [{ label: 'Settings', route: '/settings', icon: 'settings' }],
    },
  ];
}