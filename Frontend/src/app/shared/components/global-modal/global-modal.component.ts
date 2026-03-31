import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalData } from '../../../core/services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-global-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-modal.component.html',
  styleUrls: ['./global-modal.component.css']
})
export class GlobalModalComponent implements OnInit, OnDestroy {
  modalData: ModalData | null = null;
  private sub: Subscription | null = null;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.sub = this.modalService.modalState$.subscribe(data => {
      this.modalData = data;
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  close() {
    this.modalService.close();
  }
}
