import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Citizen } from './citizen';

describe('Citizen', () => {
  let component: Citizen;
  let fixture: ComponentFixture<Citizen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Citizen],
    }).compileComponents();

    fixture = TestBed.createComponent(Citizen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
