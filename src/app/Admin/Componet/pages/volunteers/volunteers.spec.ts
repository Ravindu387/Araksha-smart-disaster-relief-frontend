import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Volunteers } from './volunteers';

describe('Volunteers', () => {
  let component: Volunteers;
  let fixture: ComponentFixture<Volunteers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Volunteers],
    }).compileComponents();

    fixture = TestBed.createComponent(Volunteers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
