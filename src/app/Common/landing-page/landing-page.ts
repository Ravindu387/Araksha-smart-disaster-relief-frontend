import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LandingService } from '../services/landing.service';
import { LandingStats } from '../models/landing-stats.model';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage implements OnInit, OnDestroy {
  private landingService = inject(LandingService);
  private cdr = inject(ChangeDetectorRef);

  stats: LandingStats | null = null;
  loading = true;
  error = false;
  private pollInterval: any;

  ngOnInit(): void {
    console.log('LandingPage ngOnInit called!');
    this.fetchStats();
    // Poll every 5 seconds for real-time dashboard stats update
    this.pollInterval = setInterval(() => {
      this.fetchStats();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchStats(): void {
    this.landingService.getLandingStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching landing page stats:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }
}