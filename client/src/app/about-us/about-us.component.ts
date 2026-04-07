import { Component, inject, signal, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent implements AfterViewInit {
    public themeService = inject(ThemeService);
    private el = inject(ElementRef);

    isNavbarScrolled = signal(false);

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isNavbarScrolled.set(window.scrollY > 50);
    }

    ngAfterViewInit(): void {
        this.initScrollReveal();
    }

    initScrollReveal(): void {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const revealElements = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach((el: HTMLElement) => observer.observe(el));
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }
}
