import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyRequestsComponent } from './emergency-requests.component';

describe('EmergencyRequestsComponent', () => {
  let component: EmergencyRequestsComponent;
  let fixture: ComponentFixture<EmergencyRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyRequestsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
