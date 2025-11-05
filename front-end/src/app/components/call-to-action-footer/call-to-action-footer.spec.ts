import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallToActionFooter } from './call-to-action-footer';

describe('CallToActionFooter', () => {
  let component: CallToActionFooter;
  let fixture: ComponentFixture<CallToActionFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallToActionFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallToActionFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
