import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
export class LandingPage implements OnInit {
  private landingService = inject(LandingService);
  private cdr = inject(ChangeDetectorRef);

  stats: LandingStats | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    console.log('LandingPage ngOnInit called!');
    this.landingService.getLandingStats().subscribe({
      next: (data) => {
        console.log('Landing stats fetched successfully:', JSON.stringify(data));
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