import { LoginService } from './login.service';
import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  languageList = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '正體中文' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },

  ];
  url = 'https://secret-santa-gen.web.app/';
  constructor(
    public loginService: LoginService,
    @Inject(LOCALE_ID) protected localeId: string,
    private router: Router
  ) {}

  ngOnInit(): void {
  }
  loginWithG(): void  {
    this.loginService.GoogleAuth().finally(() => {});
  }
  logout(): void {
    this.loginService.logout();
  }
  langSwitch(langCode): string{
    return `${langCode}${this.router.url}`;
  }

  get siteurl(): string{
    return `${this.url}${this.localeId}/`;
  }
}


