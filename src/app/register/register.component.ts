import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from './../login.service';
import { FirestoreService } from './../firestore.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IGroupInfo } from '../interface/igroup-info';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  data: IGroupInfo;
  user: any;
  registerForm: FormGroup;
  gid: string;
  hasEmail: boolean;
  name$ = new Subject<string>();
  queryObservable: Observable<any[]>;
  subscription = new Subscription();

  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    public loginService: LoginService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder,
    private fun: AngularFireFunctions
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
    });

    this.queryObservable = this.name$.pipe<any[]>(
      switchMap((name) =>
        this.angularFirestore
          .collection('groups')
          .doc(this.gid)
          .collection('members', (ref) => ref.where('name', '==', name))
          .valueChanges()
      )
    );
    // subscribe to changes
    this.subscription = this.queryObservable
      .pipe()
      .subscribe((queriedItems) => {
        // console.log(queriedItems[0]);
        const uid = queriedItems[0].uid;
        if (this.registerForm.get('email').dirty) {
          this.firestoreService.updateEmail(
            this.gid,
            uid,
            this.registerForm.get('email').value
          );
        }
        // console.log('uid =>', this.uid);
        const userInfo = queriedItems[0];
        userInfo.email = this.registerForm.get('email').value;
        this.sendMail(this.data, userInfo);
        this.router.navigate([`overview/${this.gid}/${uid}`]);
      });
  }

  ngOnInit() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
    this.registerForm.get('name').valueChanges.subscribe((ele) => {
      this.angularFirestore
        .collection('groups')
        .doc(this.gid)
        .collection('members', (ref) => ref.where('name', '==', ele))
        .valueChanges()
        .subscribe((x) => {
          if (x[0].email) {
            this.hasEmail = true;
            this.registerForm.get('email').setValue(x[0].email);
            this.registerForm.get('email').disable();
          } else {
            this.hasEmail = false;
            this.registerForm.get('email').setValue('');
            this.registerForm.get('email').enable();
          }
        });
    });

    // const userRef = this.angularFirestore
    //   .collection('groups')
    //   .doc(this.gid)
    //   .collection('members', (ref) => ref.where('name', '==', name));
    // userRef.valueChanges().subscribe((x) => {
    //   if (x) {
    //     this.uid = x[0].uid;
    //   }
    // });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  temp() {
    const { name } = this.registerForm.value;
    this.name$.next(name);
  }
  changeEmail() {
    this.registerForm.get('email').enable();
  }
  async sendMail(groupinfo: IGroupInfo, user): Promise<any> {
    const collable = this.fun.httpsCallable('personalMail');
    const url = `overview/${this.gid}/${user.uid}`;
    const date = groupinfo.details.dateOfExchange.toDate().toDateString();
    const data = { groupinfo, date, user, url };
    console.log(data);
    try {
      const res = await collable(data);
      res.subscribe((x) => console.log(x));
    } catch (error) {
      console.error(error);
    }
    return { success: true };
  }
}
