import { LoginService } from './login.service';
import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { IGroupInfo } from './interface/igroup-info';
import { IEventUser } from './interface/ievent-user';

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
      messages: firebase.firestore.FieldValue.arrayUnion({
        name: data.host.name,
        message: data.details.invitationMessage,
        timecode: new Date(),
      }),
      exclusionList: data.exclusionList,
      members: data.members.map((ele) => {
        return { name: ele.name, email: ele.email, drawn: false };
      }),
      timecode: firebase.firestore.FieldValue.serverTimestamp(),
    };

    data.members.forEach((ele) => {
      //重複新增bug
      userRef.collection('members').doc(ele.uid).set(ele);
    });

    userRef.set(valueData, {
      merge: true,
    });

    return this.ls.userCaseUpadated(this.Id);

    // return userRef.set(valueData, {
    //   merge: true,
    // });
  }
  updateUserInfo(userId, groupName, memberName) {
    const managerRef = this.afs
      .doc(`users/${userId}`)
      .collection('managerList')
      .doc(this.Id);
    managerRef.set(
      { groupId: this.Id, groupName, nameAsMember: memberName },
      {
        merge: true,
      }
    );
    const grouprRef = this.afs
      .doc(`users/${userId}`)
      .collection('groupList')
      .doc(this.Id);
    return grouprRef.set(
      { groupId: this.Id, groupName, nameAsMember: memberName },
      {
        merge: true,
      }
    );
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
    return groupRef.collection('members').doc(userId).valueChanges();
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

  nameDrawn(groupId, userData) {
    const groupRef: AngularFirestoreDocument<any> = this.afs.doc(
      `groups/${groupId}`
    );
    const valueData = {
      members: userData,
    };
    return groupRef.set(valueData, {
      merge: true,
    });
  }

  updateEmail(groupId, userId, userEmail) {
    const userData = this.afs
      .doc(`groups/${groupId}`)
      .collection('members')
      .doc(userId);
    return userData.set({ email: userEmail }, { merge: true });
  }
}
