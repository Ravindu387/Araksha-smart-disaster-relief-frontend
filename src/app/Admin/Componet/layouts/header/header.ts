import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  currentSection: string = 'Dashboard';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateSection(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateSection(event.urlAfterRedirects || event.url);
    });
  }

  private updateSection(url: string): void {
    if (url.includes('/inventory')) {
      this.currentSection = 'Inventory';
    } else if (url.includes('/dashboard')) {
      this.currentSection = 'Dashboard';
    } else {
      this.currentSection = 'Dashboard';
    }
  }
}
