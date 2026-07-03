import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { SchedulerService, SchedulerJob, SchedulerLog } from '../../../../Common/services/scheduler.service';
import { Icon } from '../../../../Common/icon/icon';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './scheduler.html'
})
export class SchedulerComponent implements OnInit, OnDestroy {
  private schedulerService = inject(SchedulerService);
  private cdr = inject(ChangeDetectorRef);
  private refreshSub = new Subscription();

  jobs: SchedulerJob[] = [];
  logs: SchedulerLog[] = [];
  isLoading = false;

  // Global metrics computed from jobs list
  totalExecutions = 0;
  failedExecutions = 0;
  successRate = 100;

  // Track run status of individual jobs to display local spinner
  runningJobs: { [key: string]: boolean } = {};

  ngOnInit(): void {
    this.loadData();

    // Auto-refresh data every 5 seconds to keep execution times and status updated in real-time
    this.refreshSub.add(
      interval(5000).subscribe(() => {
        this.loadData(true);
      })
    );
  }

  ngOnDestroy(): void {
    this.refreshSub.unsubscribe();
  }

  loadData(isSilent = false): void {
    if (!isSilent) {
      this.isLoading = true;
    }

    this.schedulerService.getJobs().subscribe({
      next: (jobsList) => {
        this.jobs = jobsList;
        this.computeMetrics();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load scheduler jobs:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.schedulerService.getLogs().subscribe({
      next: (logsList) => {
        this.logs = logsList;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load scheduler logs:', err);
        this.cdr.detectChanges();
      }
    });
  }

  computeMetrics(): void {
    this.totalExecutions = this.jobs.reduce((acc, job) => acc + job.totalRuns, 0);
    this.failedExecutions = this.jobs.reduce((acc, job) => acc + job.failedRuns, 0);
    const succeeded = this.totalExecutions - this.failedExecutions;
    this.successRate = this.totalExecutions > 0 ? Math.round((succeeded / this.totalExecutions) * 100) : 100;
  }

  runJobNow(jobKey: string): void {
    this.runningJobs[jobKey] = true;
    this.cdr.detectChanges();

    this.schedulerService.runJob(jobKey).subscribe({
      next: (response) => {
        console.log(`Job ${jobKey} run triggered successfully. Response:`, response);
        this.runningJobs[jobKey] = false;
        this.loadData(true); // Silent reload to capture new log entry and update metrics
      },
      error: (err) => {
        console.error(`Failed to trigger job ${jobKey}:`, err);
        this.runningJobs[jobKey] = false;
        this.loadData(true);
      }
    });
  }

  toggleJob(job: SchedulerJob): void {
    const newStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.schedulerService.toggleJobStatus(job.jobKey, newStatus).subscribe({
      next: (updatedJob) => {
        job.status = updatedJob.status;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Failed to toggle job ${job.jobKey}:`, err);
        // Fallback local toggle for offline/mock backend demo
        job.status = newStatus;
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  getJobIcon(jobKey: string): string {
    switch (jobKey) {
      case 'volunteer-reminder': return 'users';
      case 'shelter-monitoring': return 'pin';
      case 'request-escalation': return 'alert';
      case 'inventory-monitoring': return 'box';
      case 'expired-shelter-check': return 'shield';
      case 'daily-summary': return 'chart';
      default: return 'grid';
    }
  }
}
