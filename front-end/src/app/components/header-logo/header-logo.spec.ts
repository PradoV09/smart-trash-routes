import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderLogo } from './header-logo';

describe('HeaderLogo', () => {
  let component: HeaderLogo;
  let fixture: ComponentFixture<HeaderLogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderLogo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderLogo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
