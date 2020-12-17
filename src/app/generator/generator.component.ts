import { FirestoreService } from './../firestore.service';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { AngularFireFunctions } from '@angular/fire/functions';
import { LoginService } from '../login.service';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { getCurrencySymbol } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { from } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as firebase from 'firebase';
import { IGroupInfo } from '../interface/igroup-info';
import { IEventUser } from '../interface/ievent-user';

@Component({
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
})
export class GeneratorComponent implements OnInit, AfterViewInit {
  title = 'Secret Santa Generator';
  isLinear = true;
  memberList: string[];
  secretSantaFromGroup: FormGroup;
  selectedCurrency: string;
  submitData = {};
  submitted = false;

  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA];
  hostData: IEventUser;

  nameRequiredMessage = 'A name is required';

  themes = [
    { name: 'Color' },
    { name: 'Season' },
    { name: 'Country' },
    { name: 'Book' },
    { name: 'ABC' },
  ];

  currencys = [
    { value: '', viewValue: 'DEFAULT' },
    { value: 'TWD', viewValue: 'TWD' },
    { value: 'USD', viewValue: 'USD' },
    { value: 'EUR', viewValue: 'EUR' },
    { value: 'JPY', viewValue: 'JPY' },
  ];

  isExclusives = [
    { value: false, viewValue: 'Do not use exclusions' },
    { value: true, viewValue: 'Set exclusions' },
  ];

  constructor(
    private fb: FormBuilder,
    public LoginService: LoginService,
    private FirestoreService: FirestoreService,
    private _snackBar: MatSnackBar,
    private analytics: AngularFireAnalytics,
    private fun: AngularFireFunctions
  ) {}

  ngOnInit(): void {
    this.secretSantaFromGroup = this.fb.group({
      firstFormGroup: this.fb.group({
        host: this.fb.group({
          name: ['陳司翰 Max Chen', Validators.required],
          email: [
            'max.chen@tpisoftware.com',
            [Validators.required, Validators.email],
          ],
        }),
        memberArray: this.fb.array([this.createItem(), this.createItem()]),
      }),
      exclusiveFormGroup: this.fb.group({
        isExclusive: [false, Validators.required],
      }),
      detailFormGroup: this.fb.group({
        groupName: ['My Secret Santa', Validators.required],
        dateOfExchange: ['', Validators.required],
        currency: [''],
        budget: ['', Validators.required],
        invitationMessage: [
          "We're going to draw the names. You can watch the draw live.",
          Validators.required,
        ],
        themes: [
          [
            { name: 'Color' },
            { name: 'Season' },
            { name: 'Country' },
            { name: 'Book' },
            { name: 'ABC' },
          ],
        ],
      }),
    });
    this.secretSantaFromGroup.valueChanges.subscribe((x) => {
      if (this.submitted) {
        this.submitted = false;
        this.openSnackBar(
          "It seems like you made some changes, don't forget to update it!",
          'close'
        );
      }
    });

    this.secretSantaFromGroup
      .get('exclusiveFormGroup')
      .get('isExclusive')
      .valueChanges.subscribe((x) => {
        if (x) {
          this.getExclusiveList();
        } else {
          this.removeExclusiveList();
        }
      });
    this.secretSantaFromGroup
      .get('firstFormGroup')
      .valueChanges.subscribe((x) => {
        this.memberList = [x.host.name, ...x.memberArray.map((x) => x.name)];
      });
  }

  ngAfterViewInit() {
    this.secretSantaFromGroup.get('firstFormGroup').updateValueAndValidity();
  }
  createItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }
  addItem(): void {
    (this.secretSantaFromGroup
      .get('firstFormGroup')
      .get('memberArray') as FormArray).push(this.createItem());
  }
  removeItem(index: number): void {
    (this.secretSantaFromGroup
      .get('firstFormGroup')
      .get('memberArray') as FormArray).removeAt(index);
  }

  getExclusiveList() {
    const originData = [
      this.secretSantaFromGroup.get('firstFormGroup').get('host').value,
      ...this.secretSantaFromGroup.get('firstFormGroup').get('memberArray')
        .value,
    ];
    const userData = originData.map((ele) => JSON.parse(JSON.stringify(ele)));
    userData.forEach((ele) => (ele['exclusive'] = []));
    (this.secretSantaFromGroup.get(
      'exclusiveFormGroup'
    ) as FormGroup).addControl(
      'exclusiveList',
      this.fb.array(userData.map((x) => this.fb.group(x)))
    );
  }
  removeExclusiveList() {
    (this.secretSantaFromGroup.get(
      'exclusiveFormGroup'
    ) as FormGroup).removeControl('exclusiveList');
  }

  getControls() {
    return (this.secretSantaFromGroup
      .get('firstFormGroup')
      .get('memberArray') as FormArray).controls;
  }

  getExclusiveControls() {
    return (this.secretSantaFromGroup
      .get('exclusiveFormGroup')
      .get('exclusiveList') as FormArray).controls;
  }

  loginWithG() {
    this.LoginService.GoogleAuth().finally(() => {
      const userData = this.LoginService.userData;
      this.secretSantaFromGroup
        .get('firstFormGroup')
        .get('host')
        .get('name')
        .setValue(userData.displayName);
      this.secretSantaFromGroup
        .get('firstFormGroup')
        .get('host')
        .get('email')
        .setValue(userData.email);
    });
  }

  submit() {
    const memberList = [
      this.secretSantaFromGroup.get('firstFormGroup').get('host').value,
      ...this.secretSantaFromGroup.get('firstFormGroup').get('memberArray')
        .value,
    ];
    const submitData: IGroupInfo = {
      host: this.secretSantaFromGroup.get('firstFormGroup').get('host').value,
      members: memberList.map(ele => JSON.parse(JSON.stringify(ele))),
      // memberList.map(ele => JSON.parse(JSON.stringify(ele))),
      exclusionList: this.secretSantaFromGroup.get('exclusiveFormGroup').value,
      details: this.secretSantaFromGroup.get('detailFormGroup').value,
    };
    submitData.members.forEach((ele) => {
      ele['uid'] = this.FirestoreService.createRandomId;
    });
    this.hostData = submitData.members[0];
    this.submitData = submitData;
    // console.log(submitData);
    this.FirestoreService.SetUserData(submitData).then((x) => {
      if (this.LoginService.isLoggedIn) {
        this.FirestoreService.updateUserInfo(this.LoginService.userData.uid);
      }
      this.justSendEmail();
      this.openSnackBar('SUCCESS', 'close');
      this.analytics.logEvent('submit_event', {
        submitData: submitData.details,
      });

      // console.log(this.submitted)
    });
  }

  getSymbol(code) {
    return getCurrencySymbol(code, 'wide');
  }

  add(event): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.secretSantaFromGroup
        .get('detailFormGroup')
        .get('themes')
        .value.push({ name: value.trim() });
      this.secretSantaFromGroup
        .get('detailFormGroup')
        .get('themes')
        .updateValueAndValidity();
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(fruit): void {
    const index = this.secretSantaFromGroup
      .get('detailFormGroup')
      .get('themes')
      .value.indexOf(fruit);
    if (index >= 0) {
      this.secretSantaFromGroup
        .get('detailFormGroup')
        .get('themes')
        .value.splice(index, 1);
    }
  }

  logout(): void {
    this.LoginService.logout();
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  sendEmail() {
    const collable = this.fun.httpsCallable('genericEmail');
    const context = { auth: { toke: { email: 'maxchen.sihhan@gmail.com' } } };
    const data = { text: 'Sending Email with Angular.', subject: 'email test' };
    collable({ data, context }).subscribe();
  }

  get userList() {
    return [
      this.secretSantaFromGroup.get('firstFormGroup').get('host').value,
      ...this.secretSantaFromGroup.get('firstFormGroup').get('memberArray')
        .value,
    ];
  }
  get distributor() {
    const list = this.userList;
    let counter = 0;
    list.forEach((ele) => {
      ele['target'] = 'AAA' + counter;
      counter++;
    });
    return list;
  }

  justSendEmail() {
    const collable = this.fun.httpsCallable('justMail');
    // console.log(this.distributor);
    this.distributor.forEach((user) => {
      collable({
        subject: user.name,
        email: user.email,
        url: `https://secret-santa-gen.web.app/overview/${this.FirestoreService.groupId}/${user.uid}`,
        details: this.secretSantaFromGroup.get('detailFormGroup').value,
      }).subscribe({
        next(x): void {
          // console.log(x, 'done');
        },
      });
    });
    this.submitted = true;
  }
  get pagePath(): string {
    return `overview/${this.FirestoreService.groupId}/${this.hostData.uid}`;
  }
}
export function vValidator(val: string[], errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const errorV = val.filter((ele) => !isBlank(control.get(ele).value));
    const rule = val
      .map((ele) => control.get(ele).value)
      .every((ele) => isBlank(ele));
    if (rule) {
      return null;
    } else {
      return { [errorKey]: errorV };
    }
  };
}

export function isBlank(val: string): boolean {
  const regEx = /.*\S.*/;
  return regEx.test(val) && val !== null;
}
