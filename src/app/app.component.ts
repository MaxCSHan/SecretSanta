import { LoginService } from './login.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit  {
  url = 'https://secret-santa-gen.web.app';
  constructor(
    public loginService: LoginService
  ){}

  ngOnInit(){

  }
  loginWithG() {
    this.loginService.GoogleAuth().finally(() => {
    });
  }
  logout(): void {
    this.loginService.logout();
  }

}
