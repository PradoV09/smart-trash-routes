import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recorridos } from './recorridos';

describe('Recorridos', () => {
  let component: Recorridos;
  let fixture: ComponentFixture<Recorridos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recorridos],
    }).compileComponents();

    fixture = TestBed.createComponent(Recorridos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
