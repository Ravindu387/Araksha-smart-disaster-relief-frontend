import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../Common/icon/icon';
import { Toggle } from '../../../../Common/toggle/toggle';
import { UserService } from '../../../../Common/services/user.service';

type SettingsTab = 'profile' | 'notifications' | 'security';

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, Toggle],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly userService = inject(UserService);
  readonly currentUser = this.userService.currentUser;

  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'users' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'security', label: 'Security', icon: 'shield' },
  ];

  readonly activeTab = signal<SettingsTab>('profile');

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  // ---- Profile — this tab is fully wired to the Spring Boot backend ----
  name = '';
  email = '';
  department = '';

  readonly savingProfile = signal(false);
  readonly profileSaved = signal(false);
  readonly profileError = signal<string | null>(null);

  constructor() {
    // Prefill the editable fields the moment the backend user arrives.
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.name = user.name;
        this.email = user.email;
        this.department = user.department ?? '';
      }
    });
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    this.profileSaved.set(false);
    this.profileError.set(null);

    this.userService
      .updateCurrentUser({ name: this.name, email: this.email, department: this.department })
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.profileSaved.set(true);
          setTimeout(() => this.profileSaved.set(false), 2500);
        },
        error: () => {
          this.savingProfile.set(false);
          this.profileError.set('Could not save — is the backend running on localhost:8080?');
        },
      });
  }

  // ---- Notifications — UI-complete, but local only for now -------------
  // There's no preferences table on the backend yet. Wire these up the
  // same way Profile is wired once you add one.
  notificationPrefs: NotificationPref[] = [
    {
      key: 'email',
      label: 'Email Alerts',
      description: 'Get emailed when a new emergency request comes in',
      enabled: true,
    },
    {
      key: 'sms',
      label: 'SMS Alerts',
      description: 'Receive a text message for critical-priority incidents',
      enabled: true,
    },
    {
      key: 'push',
      label: 'Push Notifications',
      description: 'Browser push notifications for live updates',
      enabled: false,
    },
    {
      key: 'critical',
      label: 'Critical Incident Alerts',
      description: 'Always notify me immediately when a case is marked critical',
      enabled: true,
    },
    {
      key: 'digest',
      label: 'Daily Summary Report',
      description: 'A daily email recap of all activity across the system',
      enabled: false,
    },
  ];

  // ---- Security — UI-complete, but local only (no auth system yet) -----
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly passwordError = signal<string | null>(null);
  readonly passwordChanged = signal(false);
  readonly twoFactorEnabled = signal(false);

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError.set('Fill in all three password fields.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.passwordError.set(null);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordChanged.set(true);
    setTimeout(() => this.passwordChanged.set(false), 2500);
    // No backend auth system yet, so this just validates client-side for
    // now — wire it to a real endpoint once you add password auth.
  }
}
