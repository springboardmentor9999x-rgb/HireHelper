import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'hirehelper-theme';
  isDarkMode = signal<boolean>(true);

  constructor() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      // Default to dark mode for the premium look
      this.isDarkMode.set(true);
    }

    // Effect to apply the theme to the body and persist it
    effect(() => {
      const mode = this.isDarkMode();
      if (mode) {
        document.body.classList.remove('light-theme');
        localStorage.setItem(this.THEME_KEY, 'dark');
      } else {
        document.body.classList.add('light-theme');
        localStorage.setItem(this.THEME_KEY, 'light');
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.update((dark) => !dark);
  }
}
