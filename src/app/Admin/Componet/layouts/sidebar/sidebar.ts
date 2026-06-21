import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../../../Common/icon/icon';

interface NavItem {
  label: string;
  route: string;
  badge?: number;
  icon: string;
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
export class Sidebar {
  readonly activeIncidents = 47;
  readonly criticalPriority = 12;

  readonly navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', route: '/dashboard', icon: 'grid' }],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Emergency Requests', route: '/emergency-requests', badge: 12, icon: 'alert' },
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
        { label: 'Notifications', route: '/notifications', badge: 5, icon: 'bell' },
        { label: 'Reports', route: '/reports', icon: 'chart' },
      ],
    },
  ];
}
