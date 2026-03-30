import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() location: string = '';
  @Input() visible: boolean = false;

  private cdr = inject(ChangeDetectorRef);
  private timeoutId: any;

  ngOnInit() {
    if (this.visible) {
      this.autoDismiss();
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  show(title: string, location: string) {
    this.title = title;
    this.location = location;
    this.visible = true;
    this.cdr.detectChanges();
    this.autoDismiss();
  }

  private autoDismiss() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.visible = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  close() {
    this.visible = false;
    this.cdr.detectChanges();
  }
}
