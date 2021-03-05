import { map } from 'rxjs/operators';
import { IGroupInfo } from './../interface/igroup-info';
import { FirestoreService } from './../firestore.service';
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
  groupList:any[];
  managerList:any[];
  constructor(
    public loginService: LoginService,
    private firestoreService: FirestoreService,
    @Inject(LOCALE_ID) public localeId: string
  ) {
      this.firestoreService.getUserGroupList(this.loginService.userData.uid).then((x) => {
        x.subscribe((ele) => {
          const holder:any[] = ele;
          this.groupList = holder;
        });
      });
      this.firestoreService.getUserManagerList(this.loginService.userData.uid).then((x) => {
        x.subscribe((ele) => {
          const holder:any[] = ele;
          this.managerList = holder;
        });
      });


  }

  ngOnInit(): void {

  }
  registerPath(uid): string {
    return `register/${uid}`;
  }

  memberList(){
    return this.loginService.userData.groupList.slice(1).map( gid =>{
      this.firestoreService.getEventData(gid).then((x) => {
        x.subscribe((ele) => {
          const holder: IGroupInfo = ele;
          return holder.details;
        });
      });
    })
  }

}
