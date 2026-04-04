import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Posiciones } from './posiciones';

describe('Posiciones', () => {
  let component: Posiciones;
  let fixture: ComponentFixture<Posiciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Posiciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Posiciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
