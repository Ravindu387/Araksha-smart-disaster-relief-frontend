import { Component, OnInit, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Icon } from '../../../../Common/icon/icon';
import { SettingsService } from '../../../../Common/services/settings.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    Icon
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentSection = 'Dashboard';
  notificationCount = 5;
  adminName = 'Admin Kumar';
  adminInitials = 'AK';

  showDropdown = false;

  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadAdminProfile();
    this.updateSection(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSection(event.urlAfterRedirects);
        this.closeDropdown(); // auto close dropdown on route changes
        this.loadAdminProfile();
      });
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

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
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