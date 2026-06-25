import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocationComponent } from './allocation';

describe('Allocation', () => {
  let component: AllocationComponent;
  let fixture: ComponentFixture<AllocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
