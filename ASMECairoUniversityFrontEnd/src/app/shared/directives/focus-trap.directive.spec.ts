import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusTrapDirective } from './focus-trap.directive';

@Component({
  standalone: true,
  imports: [CommonModule, FocusTrapDirective],
  template: `
    <button id="trigger" type="button" (click)="open = true">Open</button>
    <div
      *ngIf="open"
      appFocusTrap
      (focusTrapEscape)="open = false"
      role="dialog"
      aria-label="Test dialog"
    >
      <button id="first" type="button">First</button>
      <button id="last" type="button">Last</button>
    </div>
  `,
})
class FocusTrapHostComponent {
  open = false;
}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<FocusTrapHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FocusTrapHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FocusTrapHostComponent);
    fixture.detectChanges();
  });

  it('focuses the first control, wraps Tab, closes on Escape, and restores trigger focus', async () => {
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const first = fixture.nativeElement.querySelector('#first') as HTMLButtonElement;
    const last = fixture.nativeElement.querySelector('#last') as HTMLButtonElement;
    expect(document.activeElement).toBe(first);

    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
