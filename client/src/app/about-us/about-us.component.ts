import { Component, inject, signal, HostListener, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
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
export class AboutUsComponent implements AfterViewInit, OnDestroy {
    public themeService = inject(ThemeService);
    private el = inject(ElementRef);

    isNavbarScrolled = signal(false);
    private magneticElements: HTMLElement[] = [];
    private magneticListeners: { element: HTMLElement, hover: any, leave: any }[] = [];

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isNavbarScrolled.set(window.scrollY > 50);
    }

    ngAfterViewInit(): void {
        this.initScrollReveal();
        this.initMagneticButtons();
    }

    ngOnDestroy(): void {
        this.magneticListeners.forEach(item => {
            item.element.removeEventListener('mousemove', item.hover);
            item.element.removeEventListener('mouseleave', item.leave);
        });
    }

    initMagneticButtons(): void {
        const buttons = this.el.nativeElement.querySelectorAll('.magnetic-btn');
        buttons.forEach((btn: HTMLElement) => {
            const onMouseMove = (e: MouseEvent) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            };

            const onMouseLeave = () => {
                btn.style.transform = `translate(0px, 0px)`;
            };

            btn.addEventListener('mousemove', onMouseMove);
            btn.addEventListener('mouseleave', onMouseLeave);
            this.magneticListeners.push({ element: btn, hover: onMouseMove, leave: onMouseLeave });
        });
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
