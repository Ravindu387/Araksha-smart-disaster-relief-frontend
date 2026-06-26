import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerDashboardComponent } from './volunteer-dashboard';

describe('VolunteerDashboard', () => {
  let component: VolunteerDashboardComponent;
  let fixture: ComponentFixture<VolunteerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
