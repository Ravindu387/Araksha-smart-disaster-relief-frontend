import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Icon } from '../../../../Common/icon/icon';

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

  currentSection = 'Dashboard';
  notificationCount = 5;
  adminName = 'Admin Kumar';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateSection(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSection(event.urlAfterRedirects);
      });
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