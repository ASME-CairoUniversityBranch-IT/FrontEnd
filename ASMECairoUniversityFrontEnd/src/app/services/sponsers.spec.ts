import { TestBed } from '@angular/core/testing';

import { Sponsers } from './sponsers';

describe('Sponsers', () => {
  let service: Sponsers;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sponsers);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
