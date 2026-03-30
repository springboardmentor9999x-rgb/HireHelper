import { Component, OnInit, inject, AfterViewInit, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, AfterViewInit {
    private http = inject(HttpClient);
    private el = inject(ElementRef);
    
    ngOnInit(): void {}

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
}
