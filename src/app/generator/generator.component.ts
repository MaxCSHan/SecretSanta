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
import { HttpClient } from '@angular/common/http';

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
  memberSet = [];
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
          name: ['陳司翰 Max Chen', required],
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
        groupName: ['My Secret Santa', required],
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
      .get('firstFormGroup')
      .get('memberArray')
      .valueChanges.subscribe((x) => {
        (this.secretSantaFromGroup
          .get('firstFormGroup')
          .get('memberArray') as FormArray).controls.forEach((ele) => {
          ele
            .get('name')
            .setValidators([required, nameDuplicateValid(this.userList)]);
        });
        this.secretSantaFromGroup
          .get('firstFormGroup')
          .get('memberArray')
          .updateValueAndValidity({ emitEvent: false });
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

  ngAfterViewInit(): void {
    this.secretSantaFromGroup.get('firstFormGroup').updateValueAndValidity();
    this.secretSantaFromGroup
      .get('firstFormGroup')
      .get('memberArray')
      .updateValueAndValidity();
  }
  createItem(): FormGroup {
    return this.fb.group({
      name: ['', [required, nameDuplicateValid(this.userList)]],
      email: ['', [Validators.email]],
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
    const submitData: IGroupInfo = {
      host: JSON.parse(JSON.stringify(this.secretSantaFromGroup.get('firstFormGroup').get('host').value)),
      members: this.distributor.map((ele) => JSON.parse(JSON.stringify(ele))),
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
      // this.justSendEmail();
      this.submitted = true;
      this.openSnackBar('The event created successfully!', 'close');
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

  get userList(): IEventUser[] {
    return this.secretSantaFromGroup
      ? [
          {...this.secretSantaFromGroup.get('firstFormGroup').get('host').value,host:true},
          ...this.secretSantaFromGroup.get('firstFormGroup').get('memberArray')
            .value,
        ]
      : [];
  }
  get distributor() {
    const list = this.userList;
    const randomizedArr = this.shuffle(this.userList);
    console.log(randomizedArr);
    for (let i = 0; i < list.length; i++) {
      let pos = randomizedArr.indexOf(list[i]) + 1;
      if (pos === list.length) {
        pos = pos - list.length;
      }
      list[i]['target'] = randomizedArr[pos].name;
    }
    console.log(list);

    // list.forEach((ele, index) => {
    //   ele['target'] = randomizedArr[index].name;
    // });
    return list;
  }
  shuffle(array): any[] {
    let m = array.length;
    let t: any;
    let i: number;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  justSendEmail() {
    const collable = this.fun.httpsCallable('contactUs');
    // console.log(this.distributor);
    this.distributor.forEach((user) => {
      collable({
        subject: user.name,
        email: user.email,
        url: `https://secret-santa-gen.web.app/overview/${this.FirestoreService.groupId}/${user.uid}`,
        details: this.secretSantaFromGroup.get('detailFormGroup').value,
      }).subscribe({
        next(x): void {
          console.log(x, 'done');
        },
      });
    });
    this.submitted = true;
  }
  get pagePath(): string {
    return `register/${this.FirestoreService.groupId}`;
    // return `overview/${this.FirestoreService.groupId}/${this.hostData.uid}`;
  }
}
export function nameDuplicateValid(val: IEventUser[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const errorKey = {};
    const nameArray: string[] = val.map((ele) => ele.name);
    nameArray.push(control.value);
    const rule = nameArray.filter((x) => x === control.value).length <= 1;
    // console.log( nameArray,control.value, nameArray.filter((x) => x === control.value.name),rule)
    if (rule) {
      return null;
    } else {
      errorKey['duplicated'] = 'This name is duplicated';
      // console.log(errorKey);
      return errorKey;
    }
  };
}

export function arrayDuplicateValid(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const errorKey = {};
    const nameArray: string[] = control.value.map((ele) => ele.name);
    const isDu = nameArray.filter((x, index) => nameArray.indexOf(x) !== index);
    // console.log(isDu,'jhi')
    if (isDu.length === 0) {
      return null;
    } else {
      errorKey['duplicated'] = isDu;
      console.log(errorKey);
      return errorKey;
    }
  };
}

export function required(
  control: AbstractControl
): { [key: string]: any } | null {
  if (!isNotBlank(control.value)) {
    return { ['required']: 'A name is required' };
  }
  return null;
}

export function isNotBlank(val: string): boolean {
  const regEx = /.*\S.*/;
  return regEx.test(val) && val !== null;
}
