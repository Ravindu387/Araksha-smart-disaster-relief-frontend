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
    { id: 'integrations', label: 'Integrations', icon: 'box' },
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
  firstName = 'Admin';
  lastName = 'Kumar';
  email = 'a.kumar@sdrms.gov';
  phone = '+1 (202) 555-0100';
  jobTitle = 'System Administrator'; // maps to the backend's `department` field
  location = 'Washington, D.C.';
  bio = 'Senior systems administrator overseeing national disaster relief coordination platform.';
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
        this.firstName = first ?? 'Admin';
        this.lastName = rest.join(' ') ?? 'Kumar';
        this.email = user.email ?? 'a.kumar@sdrms.gov';
        this.jobTitle = user.department ?? 'System Administrator';
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
  readonly showCurrentPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordChanged = signal(false);
  readonly twoFactorEnabled = signal(true);

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

  /** 0–4 score used to drive the 4-bar password-strength meter. */
  get passwordStrengthScore(): number {
    const pw = this.newPassword;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    switch (this.passwordStrengthScore) {
      case 0:
        return 'Too short';
      case 1:
        return 'Weak — try a longer password';
      case 2:
        return 'Fair — mix upper/lowercase and numbers';
      case 3:
        return 'Good — add symbols for stronger security';
      default:
        return 'Strong';
    }
  }

  // ---- Security extras — 2FA, session controls, active sessions --------
  // All local-only: there's no auth/session backend yet.
  readonly twoFactorBackupCodes = 8;
  readonly authenticatorConfigured = true;
  readonly passwordLastChangedDays = 47;

  viewBackupCodes(): void {
    window.alert(`You have ${this.twoFactorBackupCodes} backup codes remaining. (Not wired to a backend yet.)`);
  }

  resetAuthenticator(): void {
    const confirmed = window.confirm('Reset your authenticator app? You will need to re-scan a new QR code.');
    if (confirmed) {
      window.alert('Authenticator reset isn\'t wired to a backend yet — nothing changed.');
    }
  }

  loginAlertsEnabled = signal(true);
  auditLogEnabled = signal(true);
  ipWhitelistEnabled = signal(false);
  sessionTimeout = '8h';
  passwordExpiry = '90d';

  activeSessions = [
    {
      id: 'session-1',
      device: 'MacBook Pro 16"',
      icon: 'laptop',
      location: 'Washington, D.C.',
      ip: '192.168.1.105',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'session-2',
      device: 'iPhone 15 Pro',
      icon: 'smartphone',
      location: 'Washington, D.C.',
      ip: '192.168.1.112',
      lastActive: '2h ago',
      current: false,
    },
    {
      id: 'session-3',
      device: 'Chrome · Windows',
      icon: 'laptop',
      location: 'Arlington, VA',
      ip: '198.51.100.42',
      lastActive: 'Yesterday',
      current: false,
    },
  ];

  revokeSession(id: string): void {
    this.activeSessions = this.activeSessions.filter((s) => s.id !== id);
  }

  signOutAllOtherSessions(): void {
    this.activeSessions = this.activeSessions.filter((s) => s.current);
  }

  // ---- System — local-only, no backend endpoint for these yet ----------
  autoAssignVolunteers = signal(true);
  aiRecommendations = signal(true);
  gpsVolunteerTracking = signal(true);
  publicEmergencyAlerts = signal(true);

  dataRetentionPeriod = '1 year';
  automatedBackups = 'Daily';

  readonly systemStats = [
    { icon: 'clock', value: '2h ago', label: 'Last Backup', color: 'text-emerald-500' },
    { icon: 'database', value: '4.2 GB', label: 'Storage Used', color: 'text-blue-500' },
    { icon: 'refresh', value: '128,440', label: 'Total Records', color: 'text-violet-500' },
  ];

  maintenanceMode = signal(false);
  debugMode = signal(false);
  readonly cacheCleared = signal(false);

  clearSystemCache(): void {
    this.cacheCleared.set(true);
    setTimeout(() => this.cacheCleared.set(false), 2000);
  }

  // ---- Appearance — local-only, no backend endpoint for these yet ------
  theme = signal<'light' | 'dark' | 'system'>('light');

  readonly accentColors: { name: string; hex: string }[] = [
    { name: 'blue', hex: '#2563EB' },
    { name: 'purple', hex: '#9333EA' },
    { name: 'green', hex: '#16A34A' },
    { name: 'red', hex: '#DC2626' },
    { name: 'orange', hex: '#EA580C' },
    { name: 'teal', hex: '#0D9488' },
  ];
  selectedAccentColor = signal(this.accentColors[0]);

  displayDensity = signal<'compact' | 'default' | 'spacious'>('default');

  sidebarCollapsedByDefault = signal(false);
  uiAnimations = signal(true);

  // ---- Integrations ----------------------------------------------------
  integrations = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Post alerts and updates to Slack channels',
      icon: 'slack',
      connected: true,
      logo: 'https://cdn.brandfolder.io/5H442UZP/as/pl546j-70upn4-11t2g2/slack-octothorpe.png'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Send SMS notifications to field workers',
      icon: 'phone',
      connected: false,
      logo: 'https://www.twilio.com/marketing/assets/images/logos/twilio-logo-red.png'
    },
    {
      id: 's3',
      name: 'AWS S3 Backups',
      description: 'Store automated database backups in Amazon S3',
      icon: 'database',
      connected: true,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg'
    }
  ];

  toggleIntegration(id: string): void {
    const integration = this.integrations.find(i => i.id === id);
    if (integration) {
      integration.connected = !integration.connected;
      this.genericSaved.set(true);
      setTimeout(() => this.genericSaved.set(false), 2000);
    }
  }

  // ---- Team & Access — local-only, no backend endpoint for these yet ---
  readonly roleOptions = [
    'Super Admin',
    'Operations Manager',
    'Shelter Coordinator',
    'Inventory Manager',
    'Field Coordinator',
  ];

  teamMembers = [
    {
      id: 'member-1',
      name: 'Admin Kumar',
      email: 'a.kumar@sdrms.gov',
      role: 'Super Admin',
      lastActive: '2 min ago',
      initials: 'AK',
      color: 'bg-blue-600',
    },
    {
      id: 'member-2',
      name: 'Patricia Kim',
      email: 'p.kim@sdrms.gov',
      role: 'Operations Manager',
      lastActive: '1h ago',
      initials: 'PK',
      color: 'bg-purple-600',
    },
    {
      id: 'member-3',
      name: 'Marcus Thompson',
      email: 'm.thompson@sdrms.gov',
      role: 'Shelter Coordinator',
      lastActive: '3h ago',
      initials: 'MT',
      color: 'bg-emerald-600',
    },
    {
      id: 'member-4',
      name: 'Sandra Lee',
      email: 's.lee@sdrms.gov',
      role: 'Inventory Manager',
      lastActive: 'Yesterday',
      initials: 'SL',
      color: 'bg-amber-600',
    },
    {
      id: 'member-5',
      name: 'Carlos Vega',
      email: 'c.vega@sdrms.gov',
      role: 'Field Coordinator',
      lastActive: '2d ago',
      initials: 'CV',
      color: 'bg-rose-600',
    },
  ];

  readonly memberColors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];

  removeMember(id: string): void {
    const member = this.teamMembers.find((m) => m.id === id);
    if (member && window.confirm(`Remove ${member.name} from this platform?`)) {
      this.teamMembers = this.teamMembers.filter((m) => m.id !== id);
    }
  }

  inviteEmail = '';
  inviteRole = this.roleOptions[0];
  readonly inviteError = signal<string | null>(null);

  inviteMember(): void {
    const email = this.inviteEmail.trim();
    if (!email || !email.includes('@')) {
      this.inviteError.set('Enter a valid email address.');
      return;
    }
    if (this.teamMembers.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      this.inviteError.set('That email is already on the team.');
      return;
    }

    this.inviteError.set(null);
    const namePart = email.split('@')[0].replace(/[._]/g, ' ');
    const name = namePart.replace(/\b\w/g, (c) => c.toUpperCase());
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    this.teamMembers = [
      ...this.teamMembers,
      {
        id: `member-${Date.now()}`,
        name,
        email,
        role: this.inviteRole,
        lastActive: 'Just invited',
        initials,
        color: this.memberColors[this.teamMembers.length % this.memberColors.length],
      },
    ];
    this.inviteEmail = '';
  }

  // ---- API Keys --------------------------------------------------------
  apiKeys = [
    { id: 'key-1', name: 'Production Read-Only', prefix: 'sdrms_live_...7x92', createdAt: '2026-03-12', lastUsed: 'Active 2m ago' },
    { id: 'key-2', name: 'Staging API Access', prefix: 'sdrms_test_...3a8f', createdAt: '2026-05-18', lastUsed: 'Active 4h ago' }
  ];

  newApiKeyName = '';
  showApiKeyCreatedModal = signal(false);
  newGeneratedKey = '';

  generateApiKey(name: string): void {
    const keyName = name.trim();
    if (!keyName) return;
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `sdrms_live_${randomHex.slice(0, 16)}`;
    this.newGeneratedKey = newKey;
    this.apiKeys.unshift({
      id: `key-${Date.now()}`,
      name: keyName,
      prefix: `${newKey.slice(0, 15)}...${newKey.slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never used'
    });
    this.newApiKeyName = '';
    this.showApiKeyCreatedModal.set(true);
  }

  revokeApiKey(id: string): void {
    if (window.confirm('Are you sure you want to revoke this API key? Applications using it will lose platform access.')) {
      this.apiKeys = this.apiKeys.filter(k => k.id !== id);
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    window.alert('API Key copied to clipboard!');
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