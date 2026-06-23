import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Allocation } from './allocation';

describe('Allocation', () => {
  let component: Allocation;
  let fixture: ComponentFixture<Allocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Allocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Allocation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
