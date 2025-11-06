import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialLoginButtons } from './social-login-buttons';

describe('SocialLoginButtons', () => {
  let component: SocialLoginButtons;
  let fixture: ComponentFixture<SocialLoginButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialLoginButtons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialLoginButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
