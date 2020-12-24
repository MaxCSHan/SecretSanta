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
import firebase from 'firebase/app';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-eventpage',
  templateUrl: './eventpage.component.html',
  styleUrls: ['./eventpage.component.scss'],
})
export class EventpageComponent implements OnInit {
  data: IGroupInfo;
  user: any;
  gid: string;
  messages: FormControl;
  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
    public loginService: LoginService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.route.params.subscribe((params) => {
      // console.log('params :',params);
      if (params.gid) {
        this.gid = params.gid;
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
    this.messages = this.fb.control(['']);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  get goToResult() {
    return `/show-result`;
  }

  checkDrawnName() {
    this.openSnackBar(this.user.target, 'Done');
    if (!this.user.drawn) {
      let newdata = this.data.members.filter((x) => x.name !== this.user.name);
      newdata.push({
        name: this.user.name,
        email: this.user.email,
        drawn: true,
      });
      this.firestoreService.nameDrawn(this.gid, newdata);
    }
  }

  get memberList(): any[] {
    return this.data.members.sort((a: any, b: any) =>
      a.name >= b.name ? 0 : -1
    );
  }
  get allDrawn(): boolean {
    return this.data.members.every((ele) => ele.drawn === true);
  }

  leaveMessage() {
    const groupRef = this.angularFirestore.collection('groups').doc(this.gid);
    groupRef.update({
      messages: firebase.firestore.FieldValue.arrayUnion({
        name: this.user.name,
        message: this.messages.value,
        timecode: new Date(),
      }),
    });
    this.messages.setValue('');
  }
}
