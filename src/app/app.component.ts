import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit  {
  url = 'https://secret-santa-gen.web.app';
  constructor(){}

  ngOnInit(){

  }

}
