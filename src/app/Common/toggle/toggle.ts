import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      (click)="toggle()"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0"
      [class.bg-blue-600]="checked"
      [class.bg-gray-200]="!checked"
    >
      <span
        class="inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200"
        [style.transform]="checked ? 'translateX(22px)' : 'translateX(2px)'"
      ></span>
    </button>
  `,
})
export class Toggle {
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
