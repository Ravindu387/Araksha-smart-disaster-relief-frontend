import { Component, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements AfterViewInit {

  ngAfterViewInit(): void {

    new Chart('trendChart', {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'Requests',
            data: [120, 180, 250, 310, 280, 340, 420],
            tension: 0.4
          }
        ]
      }
    });

    new Chart('statusChart', {
      type: 'doughnut',
      data: {
        labels: [
          'Resolved',
          'In Progress',
          'Pending',
          'Critical',
          'Cancelled'
        ],
        datasets: [{
          data: [780, 247, 142, 35, 80]
        }]
      }
    });

  }
}