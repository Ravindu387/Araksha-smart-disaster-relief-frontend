import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsComponent } from './notification';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to "all" tab', () => {
    expect(component.activeTab).toBe('all');
  });

  it('should filter notifications by tab', () => {
    component.setTab('alerts');
    expect(
      component.filteredNotifications.every((n) => n.category === 'alerts')
    ).toBe(true);
  });

  it('should mark all notifications as read', () => {
    component.markAllRead();
    expect(component.unreadCount).toBe(0);
  });

  it('should show all notifications on "all" tab', () => {
    component.setTab('all');
    expect(component.filteredNotifications.length).toBe(
      component.notifications.length
    );
  });

  it('should mark a single notification as read', () => {
    const unreadNotif = component.notifications.find((n) => !n.read);
    if (unreadNotif) {
      component.markAsRead(unreadNotif.id);
      const updated = component.notifications.find((n) => n.id === unreadNotif.id);
      expect(updated?.read).toBe(true);
    }
  });

  it('should return correct unread count per tab', () => {
    const alertsUnread = component.notifications.filter(
      (n) => n.category === 'alerts' && !n.read
    ).length;
    expect(component.getTabUnreadCount('alerts')).toBe(alertsUnread);
  });
});