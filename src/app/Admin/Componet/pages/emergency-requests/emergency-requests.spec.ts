import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyRequests } from './emergency-requests';

describe('EmergencyRequests', () => {
  let component: EmergencyRequests;
  let fixture: ComponentFixture<EmergencyRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
