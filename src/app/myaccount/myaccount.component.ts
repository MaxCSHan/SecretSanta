import {
  Component,
  OnInit,
  AfterViewInit,
  LOCALE_ID,
  Inject,
} from '@angular/core';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.component.html',
  styleUrls: ['./myaccount.component.scss']
})
export class MyaccountComponent implements OnInit {

  constructor(
    public loginService: LoginService,
    @Inject(LOCALE_ID) public localeId: string
  ) {}

  ngOnInit(): void {
  }

}
