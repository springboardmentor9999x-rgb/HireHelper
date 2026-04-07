import { Component, OnInit, inject, AfterViewInit, ElementRef, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

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
    public themeService = inject(ThemeService);

    isNavbarScrolled = signal(false);

    stats = { users: 0, tasks: 0, completed: 0 };
    displayStats = { users: 0, tasks: 0, completed: 0 };
    private statsAnimated = false;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isNavbarScrolled.set(window.scrollY > 50);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
        this.handle3DTilt(e);
        this.handleMagneticButtons(e);
    }

    ngOnInit(): void {
        this.fetchStats();
    }

    ngAfterViewInit(): void {
        this.initScrollReveal();
    }

    fetchStats() {
        this.http.get<any>('/api/public/stats').subscribe({
            next: (res) => {
                if (res.success && res.stats) {
                    // Update max values, but keep displayStats at 0 initially
                    this.stats.users = res.stats.users;
                    this.stats.tasks = res.stats.tasks;
                    this.stats.completed = res.stats.completed;
                }
            },
            error: (err) => console.error('Error fetching stats:', err)
        });
    }

    private handle3DTilt(e: MouseEvent) {
        const mockup = this.el.nativeElement.querySelector('.dashboard-mockup');
        if (!mockup) return;

        const rect = mockup.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 25;
            const rotateY = (centerX - x) / 25;

            mockup.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        } else {
            mockup.style.transform = `rotateX(10deg) rotateY(-5deg) scale(1)`;
        }
    }

    private handleMagneticButtons(e: MouseEvent) {
        const buttons = this.el.nativeElement.querySelectorAll('.magnetic-btn');
        buttons.forEach((btn: HTMLElement) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            if (Math.abs(x) < 100 && Math.abs(y) < 100) {
                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            } else {
                btn.style.transform = `translate(0, 0)`;
            }
        });
    }

    initScrollReveal(): void {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    if (entry.target.classList.contains('stats-bar') && !this.statsAnimated) {
                        this.animateStats();
                        this.statsAnimated = true;
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const revealElements = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach((el: HTMLElement) => observer.observe(el));
    }

    animateStats() {
        const duration = 2000;
        const fps = 60;
        const steps = duration / (1000 / fps);
        let currentStep = 0;

        const usersStep = this.stats.users / steps;
        const tasksStep = this.stats.tasks / steps;
        const completedStep = this.stats.completed / steps;

        const timer = setInterval(() => {
            currentStep++;
            this.displayStats.users = Math.floor(usersStep * currentStep);
            this.displayStats.tasks = Math.floor(tasksStep * currentStep);
            this.displayStats.completed = Math.floor(completedStep * currentStep);

            if (currentStep >= steps) {
                this.displayStats.users = this.stats.users;
                this.displayStats.tasks = this.stats.tasks;
                this.displayStats.completed = this.stats.completed;
                clearInterval(timer);
            }
        }, 1000 / fps);
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }
}
