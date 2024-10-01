import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from './../login.service';
import { FirestoreService } from './../firestore.service';
import { Component, OnInit, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import { IGroupInfo } from '../interface/igroup-info';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
  currentEmail: string;
  isSent: boolean;

  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    public loginService: LoginService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder,
    private fun: AngularFireFunctions,
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
    });

    this.queryObservable = this.name$.pipe(
      debounceTime(2000),
      switchMap((name) =>
        this.angularFirestore
          .collection('groups')
          .doc(this.gid)
          .collection('members', (ref) => ref.where('name', '==', name))
          .valueChanges()
      ),
      debounceTime(1000)
    );
    // subscribe to changes
    this.subscription = this.queryObservable.subscribe((queriedItems) => {
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
      this.sendMail(this.data, userInfo).then(() => {
        if (!this.isSent) {
          this.firestoreService.markEmailAsSent(this.gid, uid);
        }
        let snackMes = 'The mail has been sent successfully!';
        let snackBtn = 'close';

        switch (this.localeId) {
          case 'zh':
            snackMes = '信件已寄出！';
            snackBtn = '關閉';
            break;
          case 'ja':
            snackMes = 'イベントが作成された！';
            snackBtn = '閉める';
            break;
          case 'fr':
            snackMes = "L'événement est créé！";
            snackBtn = 'fermez';
            break;
          default:
            break;
        }

        this.openSnackBar(snackMes, snackBtn);
      });
      // this.router.navigate([`overview/${this.gid}/${uid}`]);
    });
  }

  ngOnInit(): void {
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
        .subscribe((res) => {
          this.isSent = res[0].isSent ? true : false;
          if (res[0].email) {
            this.hasEmail = true;
            this.registerForm.get('email').setValue(res[0].email);
            this.currentEmail = res[0].email;
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
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openSnackBar(message: string, action: string): void {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  temp(): void {
    const { name } = this.registerForm.value;
    this.name$.next(name);
  }
  changeEmail(): void {
    this.registerForm.get('email').enable();
  }
  updateChangeEmail(): void {
    this.registerForm.get('email').disable();
    this.currentEmail = this.registerForm.get('email').value;
  }
  discardChangeEmail(): void {
    this.registerForm.get('email').setValue(this.currentEmail);
    this.registerForm.get('email').disable();
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
