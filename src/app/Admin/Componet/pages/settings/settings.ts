import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../Common/icon/icon';
import { Toggle, ToggleColor } from '../../../../Common/toggle/toggle';
import { UserService } from '../../../../Common/services/user.service';

type SettingsSection =
  | 'profile'
  | 'notifications'
  | 'security'
  | 'system'
  | 'appearance'
  | 'integrations'
  | 'team'
  | 'api-keys';

interface NotificationToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  color: ToggleColor;
}

interface DeliveryChannel {
  key: string;
  label: string;
  detail: string;
  icon: string;
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

  // ---- Sub-nav --------------------------------------------------------
  readonly sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'system', label: 'System', icon: 'globe' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'integrations', label: 'Integrations', icon: 'database' },
    { id: 'team', label: 'Team & Access', icon: 'users' },
    { id: 'api-keys', label: 'API Keys', icon: 'key' },
  ];

  readonly activeSection = signal<SettingsSection>('profile');

  setSection(section: SettingsSection): void {
    this.activeSection.set(section);
  }

  // ---- Profile — name/email/department are wired to the Spring Boot ---
  // backend (GET/PUT /api/users/me). firstName/lastName/phone/jobTitle/
  // location/bio/timezone/language are UI-only for now: there's no column
  // for them yet, so they reset on reload. Wire them up the same way
  // name/email are once you add the fields on the backend User entity.
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  jobTitle = ''; // maps to the backend's `department` field
  location = '';
  bio = '';
  timezone = 'America/New_York';
  language = 'English (US)';

  readonly savingProfile = signal(false);
  readonly profileSaved = signal(false);
  readonly profileError = signal<string | null>(null);

  constructor() {
    // Prefill the editable fields the moment the backend user arrives.
    effect(() => {
      const user = this.currentUser();
      if (user) {
        const [first, ...rest] = user.name.split(' ');
        this.firstName = first ?? '';
        this.lastName = rest.join(' ');
        this.email = user.email;
        this.jobTitle = user.department ?? '';
      }
    });
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    this.profileSaved.set(false);
    this.profileError.set(null);

    const name = [this.firstName, this.lastName].filter(Boolean).join(' ');

    this.userService
      .updateCurrentUser({ name, email: this.email, department: this.jobTitle })
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

  // ---- Danger zone ------------------------------------------------------
  exportAccountData(): void {
    const user = this.currentUser();
    const payload = {
      ...user,
      phone: this.phone,
      jobTitle: this.jobTitle,
      location: this.location,
      bio: this.bio,
      timezone: this.timezone,
      language: this.language,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sdrms-account-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  deleteAccount(): void {
    // No backend delete endpoint yet — this just confirms the intent for now.
    const confirmed = window.confirm(
      'This will permanently delete your account and all associated data. This cannot be undone. Continue?'
    );
    if (confirmed) {
      window.alert('Account deletion isn\'t wired to the backend yet — nothing was deleted.');
    }
  }

  // ---- Notifications — UI-complete, but local only for now -------------
  // There's no preferences table on the backend yet. Wire these up the
  // same way Profile is wired once you add one.
  alertPriorities: NotificationToggle[] = [
    {
      key: 'critical',
      label: 'Critical Alerts',
      description: 'Life-threatening emergencies — always on',
      enabled: true,
      color: 'rose',
    },
    {
      key: 'high-priority',
      label: 'High Priority Incidents',
      description: 'Significant emergencies requiring quick action',
      enabled: true,
      color: 'amber',
    },
    {
      key: 'volunteer-assignments',
      label: 'Volunteer Assignments',
      description: 'When a volunteer is assigned to or completes a request',
      enabled: true,
      color: 'blue',
    },
    {
      key: 'low-inventory',
      label: 'Low Inventory Warnings',
      description: 'When stock falls below threshold levels',
      enabled: true,
      color: 'amber',
    },
    {
      key: 'shelter-capacity',
      label: 'Shelter Capacity Alerts',
      description: 'When shelters reach 80% or 100% capacity',
      enabled: true,
      color: 'amber',
    },
    {
      key: 'volunteer-status',
      label: 'Volunteer Status Updates',
      description: 'Availability changes and check-ins',
      enabled: false,
      color: 'blue',
    },
  ];

  deliveryChannels: DeliveryChannel[] = [
    { key: 'email', label: 'Email', detail: '', icon: 'mail', enabled: true },
    { key: 'sms', label: 'SMS', detail: '', icon: 'phone', enabled: true },
    { key: 'push', label: 'Push', detail: 'Mobile & desktop', icon: 'bell', enabled: true },
    { key: 'in-app', label: 'In-App', detail: 'Dashboard alerts', icon: 'activity', enabled: true },
  ];

  readonly quietHoursEnabled = signal(false);

  reportsDigests: NotificationToggle[] = [
    {
      key: 'daily-digest',
      label: 'Daily Operations Digest',
      description: 'Summary of all activity — sent every morning at 8 AM',
      enabled: true,
      color: 'blue',
    },
    {
      key: 'weekly-report',
      label: 'Weekly Performance Report',
      description: 'Trends, volunteer metrics, resource usage — every Monday',
      enabled: true,
      color: 'blue',
    },
    {
      key: 'system-updates',
      label: 'System Update Announcements',
      description: 'Platform changes and maintenance windows',
      enabled: false,
      color: 'blue',
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

  // ---- Header "Save Changes" button -------------------------------------
  // Only Profile is backend-wired; on every other section this just gives
  // the same "Saved" feedback locally so the button feels consistent.
  readonly genericSaved = signal(false);

  onSaveChanges(): void {
    if (this.activeSection() === 'profile') {
      this.saveProfile();
      return;
    }
    this.genericSaved.set(true);
    setTimeout(() => this.genericSaved.set(false), 2000);
  }
}
