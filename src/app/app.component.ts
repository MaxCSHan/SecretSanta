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
  ];
  url = 'https://secret-santa-gen.web.app/';
  lang = 'en';
  constructor(
    public loginService: LoginService,
    @Inject(LOCALE_ID) protected localeId: string,
    private router: Router
  ) {}

  ngOnInit() {}
  loginWithG() {
    this.loginService.GoogleAuth().finally(() => {});
  }
  logout(): void {
    this.loginService.logout();
  }
  langSwitch(langCode){
    this.lang = langCode;
    return `${langCode}${this.router.url}`;
  }

  get siteurl(): string{
    console.log(`${this.url}${this.lang}/`)
    return `${this.url}${this.lang}/`;
  }
}
