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
    public afs: AngularFirestore // Inject Firestore service
  ) {}

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(data) {
    const Id = this.afs.createId();
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`groups/${Id}`);
    const valueDate = {
      data,
      Id,
    };
    return userRef.set(valueDate, {
      merge: true,
    });
  }

  // get userData(): User{
  //   const userData: User = {
  //     uid: this.user.uid,
  //     email: this.user.email,
  //     displayName: this.user.displayName,
  //     photoURL: this.user.photoURL,
  //     emailVerified: this.user.emailVerified,
  //   };
  //   return userData;
  // }
}
