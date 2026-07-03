import { Component, OnInit, Output, EventEmitter, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Icon } from '../../../../Common/icon/icon';
import { SettingsService } from '../../../../Common/services/settings.service';
import { SearchService } from '../../../../Common/services/search.service';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationItem } from '../../../../Common/services/notification.service';

interface CommandOption {
  name: string;
  description: string;
  route: string;
  category: string;
  icon: string;
  keywords: string[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Icon
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentSection = 'Dashboard';
  adminName = 'Admin Kumar';
  adminInitials = 'AK';

  showDropdown = false;
  showNotificationDropdown = false;
  searchQuery = '';

  notifications: NotificationItem[] = [
    {
      id: 4,
      category: 'alerts',
      severity: 'critical',
      title: 'Flash Flood Warning',
      badge: 'RED ALERT',
      description: 'Water levels rising rapidly in Sector 4. Immediate evacuation recommended.',
      time: '5 mins ago',
      read: false
    },
    {
      id: 3,
      category: 'assignments',
      severity: 'high',
      title: 'New Rescue Mission Assigned',
      badge: 'ASSIGNMENT',
      description: 'Volunteer team Alpha-7 assigned to Shelter C.',
      time: '15 mins ago',
      read: false
    },
    {
      id: 2,
      category: 'inventory',
      severity: 'info',
      title: 'Low Water Stock',
      badge: 'STOCK LOW',
      description: 'Warehouse 2 is running below the minimum threshold of bottled water.',
      time: '1 hr ago',
      read: true
    },
    {
      id: 1,
      category: 'shelters',
      severity: 'success',
      title: 'Shelter B Capacity Updated',
      badge: 'COMPLETED',
      description: 'Additional beds added to Shelter B. Available capacity is now 50.',
      time: '2 hrs ago',
      read: true
    }
  ];

  showSearchSuggestions = false;
  activeSuggestionIndex = 0;
  filteredFeatures: CommandOption[] = [];

  readonly allFeatures: CommandOption[] = [
    {
      name: 'Operations Dashboard',
      description: 'Overview of incidents, active cases, and shelter occupancy stats',
      route: '/dashboard',
      category: 'Overview',
      icon: 'grid',
      keywords: ['dashboard', 'home', 'overview', 'stats', 'analytics', 'landing']
    },
    {
      name: 'Emergency Requests & Dispatch',
      description: 'Manage crisis requests, citizen reports, and dispatch active volunteers',
      route: '/emergency-requests',
      category: 'Operations',
      icon: 'alert',
      keywords: ['emergencies', 'requests', 'crisis', 'dispatch', 'citizen reports', 'assign', 'dispatch part']
    },
    {
      name: 'Volunteers Management',
      description: 'View available volunteers, verification documents, and skills list',
      route: '/volunteers',
      category: 'Operations',
      icon: 'users',
      keywords: ['volunteers', 'skills', 'verify', 'ratings', 'team', 'search volunteers']
    },
    {
      name: 'Shelters Registry',
      description: 'Track shelter capacities, locations on map, and occupancy status',
      route: '/shelters',
      category: 'Operations',
      icon: 'pin',
      keywords: ['shelters', 'map', 'capacity', 'region', 'occupancy', 'shelter list']
    },
    {
      name: 'Inventory Levels',
      description: 'Monitor disaster relief stock, minimum limits, and low stock items',
      route: '/inventory',
      category: 'Resources',
      icon: 'box',
      keywords: ['inventory', 'stock', 'supplies', 'food', 'water', 'medicine', 'kits', 'warehouse']
    },
    {
      name: 'Resource Allocation',
      description: 'Allocate inventory kits to active emergency requests',
      route: '/allocation',
      category: 'Resources',
      icon: 'truck',
      keywords: ['allocation', 'distribute', 'resources', 'dispatch items', 'deliveries']
    },
    {
      name: 'Live Tracking Map',
      description: 'Real-time map tracking of active emergency events and locations',
      route: '/live-tracking',
      category: 'Monitoring',
      icon: 'map',
      keywords: ['tracking', 'live', 'map', 'incidents', 'locations', 'gps']
    },
    {
      name: 'Reports & Analytics',
      description: 'Leaderboards, average response trends, and category breakdowns',
      route: '/reports',
      category: 'Monitoring',
      icon: 'chart',
      keywords: ['reports', 'analytics', 'charts', 'trends', 'leaderboard', 'performance']
    },
    {
      name: 'Notifications Center',
      description: 'System alerts, priority changes, and audit logs',
      route: '/notifications',
      category: 'Monitoring',
      icon: 'bell',
      keywords: ['notifications', 'alerts', 'messages', 'system logs', 'inbox']
    },
    {
      name: 'System Settings',
      description: 'Configure administration settings and profile details',
      route: '/settings',
      category: 'Account',
      icon: 'settings',
      keywords: ['settings', 'profile', 'account', 'administration', 'settings feature', 'password']
    }
  ];

  private settingsService = inject(SettingsService);
  private searchService = inject(SearchService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private sub = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadAdminProfile();
    this.updateSection(this.router.url);
    this.loadNotifications();

    // Sync header query with the service
    this.sub.add(
      this.searchService.searchQuery$.subscribe(q => {
        if (this.searchQuery !== q) {
          this.searchQuery = q;
          this.cdr.detectChanges();
        }
      })
    );


    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSection(event.urlAfterRedirects);
        this.closeDropdown(); // auto close dropdown on route changes
        this.loadAdminProfile();
      });

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSearchChange(query: string): void {
    console.log('[Header] onSearchChange called with:', query);
    
    const q = query.toLowerCase().trim();
    if (q.length > 0) {
      this.filteredFeatures = this.allFeatures.filter(feat =>
        feat.name.toLowerCase().includes(q) ||
        feat.description.toLowerCase().includes(q) ||
        feat.keywords.some(kw => kw.toLowerCase().includes(q))
      );
      this.showSearchSuggestions = true;
      this.activeSuggestionIndex = 0;
    } else {
      this.filteredFeatures = [];
      this.showSearchSuggestions = false;
    }

    this.searchService.setSearchQuery(query);
  }

  onSearchFocus(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (q.length > 0) {
      this.showSearchSuggestions = true;
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (!this.showSearchSuggestions || this.filteredFeatures.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.filteredFeatures.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.filteredFeatures.length) % this.filteredFeatures.length;
      event.preventDefault();
    } else if (event.key === 'Enter') {
      const feat = this.filteredFeatures[this.activeSuggestionIndex];
      this.selectFeature(feat);
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.closeSuggestions();
      event.preventDefault();
    }
  }

  selectFeature(feat: CommandOption): void {
    this.router.navigate([feat.route]);
    this.searchQuery = '';
    this.searchService.setSearchQuery('');
    this.closeSuggestions();
  }

  closeSuggestions(): void {
    this.showSearchSuggestions = false;
  }

  loadAdminProfile(): void {
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        if (data) {
          const first = data.firstName || 'Admin';
          const last = data.lastName || 'Kumar';
          this.adminName = `${first} ${last}`;
          this.adminInitials = (first.charAt(0) + (last ? last.charAt(0) : '')).toUpperCase();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading admin profile in header:', err)
    });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.showDropdown = false;
    }
  }

  closeNotificationDropdown(): void {
    this.showNotificationDropdown = false;
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item.id,
            category: item.category,
            severity: item.severity,
            title: item.title,
            badge: item.badge,
            description: item.description,
            time: item.time,
            read: item.read,
          }));
          this.notifications = mapped.sort((a, b) => b.id - a.id);
        } else {
          this.notifications.sort((a, b) => b.id - a.id);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load notifications from service, using local fallback.', err);
        this.notifications.sort((a, b) => b.id - a.id);
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to mark as read on backend, updating locally.', err);
        this.notifications = this.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        this.cdr.detectChanges();
      }
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to mark all as read on backend, updating locally.', err);
        this.notifications = this.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        this.cdr.detectChanges();
      }
    });
  }

  goToNotificationsPage(): void {
    this.closeNotificationDropdown();
    this.router.navigate(['/notifications']);
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.showNotificationDropdown = false;
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  goToProfile(): void {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  goToSettings(): void {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  goToHelp(): void {
    this.closeDropdown();
  }

  signOut(): void {
    this.closeDropdown();
    this.router.navigate(['/LandingPage']);
  }

  private updateSection(url: string): void {

    if (url.includes('/dashboard')) {
      this.currentSection = 'Dashboard';
    }
    else if (url.includes('/inventory')) {
      this.currentSection = 'Inventory';
    }
    else if (url.includes('/allocation')) {
      this.currentSection = 'Allocation';
    }
    else if (url.includes('/emergency-requests')) {
      this.currentSection = 'Emergency Requests';
    }
    else if (url.includes('/volunteers')) {
      this.currentSection = 'Volunteers';
    }
    else if (url.includes('/shelters')) {
      this.currentSection = 'Shelters';
    }
    else if (url.includes('/live-tracking')) {
      this.currentSection = 'Live Tracking';
    }
    else if (url.includes('/notifications')) {
      this.currentSection = 'Notifications';
    }
    else if (url.includes('/reports')) {
      this.currentSection = 'Reports';
    }
    else if (url.includes('/settings')) {
      this.currentSection = 'Settings';
    }
    else {
      this.currentSection = 'Dashboard';
    }
  }
}