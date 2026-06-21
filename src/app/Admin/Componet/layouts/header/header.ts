import { Component } from '@angular/core';
import { Icon } from '../../../../Common/icon/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Icon],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly breadcrumb = ['Admin', 'Dashboard'];
  readonly adminName = 'Admin Kumar';
  readonly notificationCount = 5;
}
