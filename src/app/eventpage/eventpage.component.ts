import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from './../login.service';
import { IGroupInfo } from './../interface/igroup-info';
import { Component, OnInit, Inject, LOCALE_ID} from '@angular/core';
import { FirestoreService } from './../firestore.service';
import {  AngularFirestore,} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { IEventUser } from '../interface/ievent-user';
import firebase from 'firebase/app';
import { FormBuilder, FormControl } from '@angular/forms';
import { GoogleCalendar, CalendarOptions } from 'datebook';
import * as FileSaver from 'file-saver';
import { EventAttributes, createEvent } from 'ics';

@Component({
  selector: 'app-eventpage',
  templateUrl: './eventpage.component.html',
  styleUrls: ['./eventpage.component.scss'],
})
export class EventpageComponent implements OnInit {
  data: IGroupInfo;
  user: IEventUser;
  gid: string;
  messages: FormControl;
  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
    public loginService: LoginService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder,
    @Inject(LOCALE_ID) public localeId: string
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
        x.subscribe((ele: IEventUser) => {
          const holder: IEventUser = ele;
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

  ngOnInit(): void {
    this.messages = this.fb.control(['']);
  }

  openSnackBar(message: string, action: string): void {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  get goToResult(): string {
    return `/show-result`;
  }

  checkDrawnName(): void {
    this.openSnackBar(this.user.target, 'Done');
    if (!this.user.drawn) {
      const newdata = this.data.members.filter((x) => x.name !== this.user.name);
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

  leaveMessage(): void {
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
  drawTheName(): void {
    const groupRef = this.angularFirestore.collection('groups').doc(this.gid);
    groupRef.update({
      host: {
        name: this.user.name,
        email: this.user.email,
        drawn: true,
      },
    });
  }

  downloadIcs(): void {
    // const options: Datebook.CalendarOptions = {
    //   title: this.data.details.groupName,
    //   description: this.data.details.invitationMessage,
    //   start: this.data.details.dateOfExchange.toDate(),
    //   end: this.data.details.dateOfExchange.toDate(),
    //   url:'https://secret-santa-gen.firebaseapp.com/zh/'
    // };
    // const icalendar = new Datebook.ICalendar(options)

    // icalendar.download();
    const date = this.data.details.dateOfExchange.toDate().toISOString();
    const event: EventAttributes = {
      start: [
        parseInt(date.substr(0, 4), 10),
        parseInt(date.substr(5, 2), 10),
        parseInt(date.substr(8, 2), 10),
        18,
        30,
      ],
      duration: { hours: 1 },
      title: this.data.details.groupName,
      description: `${this.data.details.invitationMessage}\n Budget:${
        this.data.details.currency
      } ${this.data.details.budget}\n Theme: ${this.data.details.themes.map(
        (ele) => ele.name
      )}`,
      url: `https://secret-santa-gen.firebaseapp.com/${this.localeId}/overview/${this.gid}/${this.user.uid}`,
      categories: ['gift exchange'],
      status: 'CONFIRMED',
      organizer: { name: this.data.host.name, email: this.data.host.email },
      attendees: this.data.members.map((ele) => {
        return { name: ele.name, email: ele.email || 'theuserhasnoemail@gmail.com' };
      }),
    };
    createEvent(event, (error, value) => {
      if (error) {
        console.log(error);
        return;
      }
      const file = new File([value], 'secret-santa-event.ics', {
        type: 'ics/calendar;charset=utf8,',
      });
      FileSaver.saveAs(file);
      console.log(value);
    });
  }
}
