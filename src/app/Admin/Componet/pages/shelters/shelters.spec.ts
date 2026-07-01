import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheltersComponent } from './shelters';

describe('SheltersComponent', () => {
  let component: SheltersComponent;
  let fixture: ComponentFixture<SheltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheltersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
