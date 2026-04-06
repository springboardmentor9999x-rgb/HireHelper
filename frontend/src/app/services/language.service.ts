import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private defaultLanguage = 'English';
  private languageMap = {
    'English': 'en',
    'Telugu': 'te',
    'Hindi': 'hi'
  };

  private currentLanguage$ = new BehaviorSubject<string>(this.defaultLanguage);
  public language$: Observable<string> = this.currentLanguage$.asObservable();
  
  private initialized = false;

  constructor(
    private translateService: TranslateService,
    private http: HttpClient
  ) {
    // Defer initialization to avoid circular dependency
    this.deferredInitialize();
  }

  /**
   * Deferred initialization to avoid circular dependency
   */
  private deferredInitialize(): void {
    setTimeout(() => {
      if (!this.initialized) {
        this.initializeTranslate();
        this.initializeLanguage();
        this.initialized = true;
      }
    }, 0);
  }

  /**
   * Initialize ngx-translate configuration
   */
  private initializeTranslate(): void {
    try {
      this.translateService.setDefaultLang('en');
      this.translateService.addLangs(['en', 'te', 'hi']);
      
      // Load default language
      this.loadLanguage('en');
      
      // Initialize language from localStorage
      const savedLanguage = localStorage.getItem('language') || this.defaultLanguage;
      this.setLanguage(savedLanguage);
    } catch (error) {
      console.warn('TranslateService initialization error:', error);
    }
  }

  /**
   * Load translation file for a language
   */
  private loadLanguage(langCode: string): void {
    this.http.get(`/assets/i18n/${langCode}.json`).subscribe(
      (translations: any) => {
        this.translateService.setTranslation(langCode, translations, true);
      },
      (error) => {
        console.warn(`Failed to load language ${langCode}:`, error);
      }
    );
  }

  /**
   * Initialize language from localStorage or use default
   */
  private initializeLanguage(): void {
    // This is now handled in initializeTranslate
  }

  /**
   * Set the current language
   */
  setLanguage(language: string): void {
    // Ensure initialization is complete
    if (!this.initialized) {
      this.initializeTranslate();
      this.initialized = true;
    }
    
    const langCode = this.languageMap[language as keyof typeof this.languageMap] || 'en';
    
    // Load language if not already loaded
    this.loadLanguage(langCode);
    
    // Use the language
    this.translateService.use(langCode);
    this.currentLanguage$.next(language);
    localStorage.setItem('language', language);
    document.documentElement.lang = langCode;
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Get language code (en, te, hi)
   */
  getLanguageCode(language: string): string {
    return this.languageMap[language as keyof typeof this.languageMap] || 'en';
  }

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    for (const [name, code_value] of Object.entries(this.languageMap)) {
      if (code_value === code) {
        return name;
      }
    }
    return this.defaultLanguage;
  }
}
