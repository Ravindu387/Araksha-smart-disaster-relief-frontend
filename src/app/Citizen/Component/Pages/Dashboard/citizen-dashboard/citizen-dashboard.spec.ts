import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitizenDashboard } from './citizen-dashboard';

describe('CitizenDashboard', () => {
  let component: CitizenDashboard;
  let fixture: ComponentFixture<CitizenDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitizenDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(CitizenDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
