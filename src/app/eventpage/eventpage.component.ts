import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from './../login.service';
import { IGroupInfo } from './../interface/igroup-info';
import { Component, OnInit } from '@angular/core';
import { FirestoreService } from './../firestore.service';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { IEventUser } from '../interface/ievent-user';

@Component({
  selector: 'app-eventpage',
  templateUrl: './eventpage.component.html',
  styleUrls: ['./eventpage.component.scss'],
})
export class EventpageComponent implements OnInit {
  data: IGroupInfo;
  user: any;
  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
    public loginService: LoginService,
    private _snackBar: MatSnackBar,

  ) {
    this.route.params.subscribe((params) => {
      // console.log('params :',params);
      if(params.gid){
        this.firestoreService.getEventData(params.gid).then((x) => {
          x.subscribe((ele) => {
            const holder: IGroupInfo = ele;
            // console.log(holder);
            this.data = holder;
            // console.log(this.data);

          });
        });
      }
      this.firestoreService.getEventUser(params.gid, params.uid).then((x) => {
          x.subscribe((ele) => {
            const holder = ele;
            // console.log('user', ele);
            this.user = holder;
            // console.log(this.user);
          });
        });
      // this.firestoreService.getUserData(params.uid).then((x) => {
      //   x.subscribe((ele) => {
      //     const holder = ele;
      //     // console.log('user', ele);
      //     this.user = holder;
      //     // console.log(this.user);
      //   });
      // });

    });
  }

  ngOnInit() {

  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  get goToResult(){
    return `/show-result`;
  }
}
