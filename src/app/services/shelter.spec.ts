import { TestBed } from '@angular/core/testing';

import { Shelter } from './shelter';

describe('Shelter', () => {
  let service: Shelter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Shelter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
