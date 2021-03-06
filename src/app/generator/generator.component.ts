import { FirestoreService } from './../firestore.service';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { AngularFireFunctions } from '@angular/fire/functions';
import { LoginService } from '../login.service';
import {
  Component,
  OnInit,
  AfterViewInit,
  LOCALE_ID,
  Inject,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { getCurrencySymbol } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    { value: false, viewValue: this.noExclusiveMes },
    { value: true, viewValue: this.setExclusiveMes },
  ];

  constructor(
    private fb: FormBuilder,
    public loginService: LoginService,
    private firestoreService: FirestoreService,
    private _snackBar: MatSnackBar,
    private analytics: AngularFireAnalytics,
    private fun: AngularFireFunctions,
    @Inject(LOCALE_ID) public localeId: string
  ) {}

  ngOnInit(): void {
    this.secretSantaFromGroup = this.fb.group({
      firstFormGroup: this.fb.group({
        host: this.fb.group({
          name: ['', required(this.localeId)],
          email: ['', [required(this.localeId), Validators.email]],
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
          'We\'re going to draw the names. You can watch the draw live.',
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
          'It seems like you made some changes, don\'t forget to update it!',
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
            .setValidators([
              required(this.localeId),
              nameDuplicateValid(this.userList, this.localeId),
            ]);
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
        this.memberList = [
          x.host.name,
          ...x.memberArray.map((ele: any) => ele.name),
        ];
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
      name: [
        '',
        [
          required(this.localeId),
          nameDuplicateValid(this.userList, this.localeId),
        ],
      ],
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

  getExclusiveList(): void {
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
  removeExclusiveList(): void {
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

  loginWithG(): void {
    this.loginService.GoogleAuth().finally(() => {
      const userData = this.loginService.userData;
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

  submit(): void {
    const submitData: IGroupInfo = {
      host: JSON.parse(
        JSON.stringify(
          this.secretSantaFromGroup.get('firstFormGroup').get('host').value
        )
      ),
      members: this.distributor.map((ele) => JSON.parse(JSON.stringify(ele))),
      // memberList.map(ele => JSON.parse(JSON.stringify(ele))),
      exclusionList: this.secretSantaFromGroup.get('exclusiveFormGroup').value,
      details: this.secretSantaFromGroup.get('detailFormGroup').value,
    };
    submitData.members.forEach((ele) => {
      ele['uid'] = this.firestoreService.createRandomId;
    });
    this.hostData = submitData.members.filter(ele => ele.host)[0];
    this.submitData = submitData;
    // console.log(submitData);
    this.firestoreService.SetUserData(submitData, this.localeId).then((x) => {
      if (this.loginService.isLoggedIn) {
        this.firestoreService.updateUserInfo(
          this.loginService.userData.uid,
          this.hostData.uid,
          this.secretSantaFromGroup.get('detailFormGroup').get('groupName')
            .value,
          this.secretSantaFromGroup.get('firstFormGroup').get('host').value.name
        );
      }
      // this.justSendEmail();
      this.submitted = true;
      let snackMes = 'The event created successfully!';
      let snackBtn = 'close';

      switch ( this.localeId){
        case('zh'):
        snackMes = '活動成功建立！';
        snackBtn = '關閉';
        break;
        case('ja'):
        snackMes = 'イベントが作成された！';
        snackBtn = '閉める';
        break;
        case('fr'):
        snackMes = 'L\'événement est créé！';
        snackBtn = 'fermez';
        break;
        default:
          break;

      }

      this.openSnackBar(snackMes, snackBtn);
      this.analytics.logEvent('submit_event', {
        submitData: submitData.details,
      });

      // console.log(this.submitted)
    });
  }

  getSymbol(code): string {
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
    this.loginService.logout();
  }
  openSnackBar(message: string, action: string): void {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  get userList(): IEventUser[] {
    return this.secretSantaFromGroup
      ? [
          {
            ...this.secretSantaFromGroup.get('firstFormGroup').get('host')
              .value,
            host: true,
          },
          ...this.secretSantaFromGroup.get('firstFormGroup').get('memberArray')
            .value,
        ]
      : [];
  }
  get distributor(): any[] {
    const randomizedArr = this.shuffle(this.userList);
    // console.log(randomizedArr);
    for (let i = 0; i < randomizedArr.length; i++) {
      let pos = i + 1;
      if (pos > randomizedArr.length - 1) {
        pos = 0;
      }
      // console.log(randomizedArr[pos].name)
      randomizedArr[i]['target'] = randomizedArr[pos]['name'];
    }
    // console.log(randomizedArr);
    // list.forEach((ele, index) => {
    //   ele['target'] = randomizedArr[index].name;
    // });
    return randomizedArr;
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

  get pagePath(): string {
    return `register/${this.firestoreService.groupId}`;
    // return `overview/${this.firestoreService.groupId}/${this.hostData.uid}`;
  }

  get setExclusiveMes(): string {
    switch (this.localeId) {
      case 'zh':
        return '設定排除清單';
      case 'ja':
        return '排除リストを設定する';
      case 'fr':
        return 'Déterminez l\'exclusions';
      default:
        return 'Set exclusions';
    }
  }
  get noExclusiveMes(): string {
    switch (this.localeId) {
      case 'zh':
        return '不設定排除清單';
      case 'ja':
        return '排除リストを設定しない';
      case 'fr':
        return 'Ne déterminez pas d\'exclusion';
      default:
        return 'Do not use exclusions';
    }
  }
}
export function nameDuplicateValid(
  val: IEventUser[],
  lang: string
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const errorKey = {};
    const nameArray: string[] = val.map((ele) => ele.name);
    nameArray.push(control.value);
    const rule = nameArray.filter((x) => x === control.value).length <= 1;
    // console.log( nameArray,control.value, nameArray.filter((x) => x === control.value.name),rule)
    if (rule) {
      return null;
    } else {
      let errorMes = 'This name is duplicated';
      switch (lang) {
        case 'zh':
          errorMes = '名稱已重複';
          break;
        case 'fr':
          errorMes = 'Le nom est dupliqué';
          break;
        case 'ja':
          errorMes = '名前が重複しています';
          break;
        default:
          break;
      }
      errorKey['duplicated'] = errorMes;
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

export function required(lang: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!isNotBlank(control.value)) {
      let errorMes = 'A name is required';
      switch (lang) {
        case 'zh':
          errorMes = '請填入姓名';
          break;
        case 'fr':
          errorMes = 'Un nom est obligatoire';
          break;
        case 'ja':
          errorMes = 'お名前を入力してください';
          break;
        default:
          break;
      }

      return { ['requiredName']: errorMes, ['required']: true };
    }
    return null;
  };
}
export function isNotBlank(val: string): boolean {
  const regEx = /.*\S.*/;
  return regEx.test(val) && val !== null;
}
