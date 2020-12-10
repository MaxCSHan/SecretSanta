import { LoginService } from './login.service';
import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  user: any;
  loginData: object;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    private ls: LoginService
  ) {}
  Id = this.afs.createId();

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(data) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`groups/${this.Id}`);
    const valueDate = {
      data,
      Id: this.Id,
      timecode: firebase.firestore.FieldValue.serverTimestamp()
    };
    return userRef.set(valueDate, {
      merge: true,
    });
  }
  updateUserInfo(userId){
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${userId}`);
    const preManArr: string[] = this.ls.userData.managerList;
    console.log(preManArr);
    preManArr.push(this.Id);
    const valueData = {
      managerList:preManArr
    };
    return userRef.update(valueData);
  }

}
