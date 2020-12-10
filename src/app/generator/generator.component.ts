import { FirestoreService } from './../firestore.service';
import { LoginService } from '../login.service';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { getCurrencySymbol } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { from } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
})
export class GeneratorComponent implements OnInit, AfterViewInit {
  title = 'Secret Santa Generator';
  isLinear = true;
  memberList: string[];
  firstFormGroup: FormGroup;
  exclusiveFormGroup: FormGroup;
  detailFormGroup: FormGroup;
  memberArray: FormArray;
  selectedCurrency: string;
  submitData = {};
  submitted = false;

  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA];
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
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.firstFormGroup = this.fb.group({
      host: this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
      }),
      memberArray: this.fb.array([this.createItem(), this.createItem()]),
    });
    this.exclusiveFormGroup = this.fb.group({
      isExclusive: [false, Validators.required],
    });
    // this.memberArray = this.fb.array([this.createItem()]);
    // console.log(
    //   this.memberArray.controls[0],
    //   this.memberArray.get([0]).get('name')
    // );
    this.detailFormGroup = this.fb.group({
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
    });
    this.exclusiveFormGroup.get('isExclusive').valueChanges.subscribe((x) => {
      if (x) {
        this.getExclusiveList();
      } else {
        this.removeExclusiveList();
      }
    });
    this.firstFormGroup.valueChanges.subscribe((x) => {
      this.memberList = [x.host.name, ...x.memberArray.map((x) => x.name)];
    });
  }

  ngAfterViewInit() {
    this.firstFormGroup.updateValueAndValidity();
  }
  createItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }
  addItem(): void {
    (this.firstFormGroup.get('memberArray') as FormArray).push(
      this.createItem()
    );
  }
  removeItem(index: number): void {
    (this.firstFormGroup.get('memberArray') as FormArray).removeAt(index);
  }

  getExclusiveList() {
    const userData = [
      this.firstFormGroup.get('host').value,
      ...this.firstFormGroup.get('memberArray').value,
    ];
    userData.forEach((ele) => (ele['exclusive'] = []));
    this.exclusiveFormGroup.addControl(
      'exclusiveList',
      this.fb.array(userData.map((x) => this.fb.group(x)))
    );
  }
  removeExclusiveList() {
    this.exclusiveFormGroup.removeControl('exclusiveList');
  }

  getControls() {
    return (this.firstFormGroup.get('memberArray') as FormArray).controls;
  }

  getExclusiveControls() {
    return (this.exclusiveFormGroup.get('exclusiveList') as FormArray).controls;
  }

  showinfo() {
    console.log(this.memberArray);
  }

  loginWithG() {
    this.LoginService.GoogleAuth().finally(() => {
      const userData = this.LoginService.userData;
      this.firstFormGroup
        .get('host')
        .get('name')
        .setValue(userData.displayName);
      this.firstFormGroup.get('host').get('email').setValue(userData.email);
    });
  }

  submit() {
    const submitData = {
      host: this.firstFormGroup.get('host').value,
      members: [
        this.firstFormGroup.get('host').value,
        ...this.firstFormGroup.get('memberArray').value,
      ],
      exclusionList: this.exclusiveFormGroup.value,
      details: this.detailFormGroup.value,
    };
    this.submitData = submitData;
    // console.log(submitData);
    this.FirestoreService.SetUserData(submitData).then((x) => {
      if(this.LoginService.isLoggedIn)
      {
        this.FirestoreService.updateUserInfo(this.LoginService.userData.uid);
      }
      this.submitted = true;
      this.openSnackBar('SUCCESS', 'close');
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
      this.detailFormGroup.get('themes').value.push({ name: value.trim() });
      this.detailFormGroup.get('themes').updateValueAndValidity();
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(fruit): void {
    const index = this.detailFormGroup.get('themes').value.indexOf(fruit);
    if (index >= 0) {
      this.detailFormGroup.get('themes').value.splice(index, 1);
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
}
