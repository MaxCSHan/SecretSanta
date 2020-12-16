import { LoginService } from './login.service';
import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { IGroupInfo } from './interface/igroup-info';
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
  SetUserData(data: IGroupInfo) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `groups/${this.Id}`
    );
    const valueData = {
      Id: this.Id,
      host: data.host,
      details: data.details,
      exclusionList: data.exclusionList,
      timecode: firebase.firestore.FieldValue.serverTimestamp(),
    };

    data.members.forEach((ele) => {
      userRef.collection('members').doc(ele.uid).set(ele, { merge: true });
    });

    return userRef.set(valueData, {
      merge: true,
    });
  }
  updateUserInfo(userId) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${userId}`
    );
    const preManArr: string[] = this.ls.userData.managerList;
    const preGrouArr: string[] = this.ls.userData.groupList;

    // console.log(preManArr);
    preManArr.push(this.Id);
    preGrouArr.push(this.Id);

    const valueData = {
      groupList: preGrouArr,
      managerList: preManArr,
    };
    return userRef.update(valueData);
  }
  async getUserData(userId) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${userId}`
    );

    return userRef.valueChanges();
  }

  async getEventUser(groupId, userId) {
    const groupRef: AngularFirestoreDocument<any> = this.afs.doc(
      `groups/${groupId}`
    );
    groupRef
      .collection('data/')
      .valueChanges()
      .subscribe((x) => console.log('cc', x));
  }

  async getEventData(groupId) {
    const groupRef: AngularFirestoreDocument<any> = this.afs.doc(
      `groups/${groupId}`
    );
    return groupRef.valueChanges();
  }
  get groupId(): string {
    return this.Id;
  }

  get createRandomId(): string {
    return this.afs.createId();
  }
}
