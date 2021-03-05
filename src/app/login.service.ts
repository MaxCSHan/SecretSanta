import { Injectable } from '@angular/core';
import { User } from '../app/shared/services/user';
import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  user: any;
  loginData: object;
  redirectUrl: string;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth // Inject Firebase auth service
  ) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.user = user;
        if (!this.isLoggedIn) {
          sessionStorage.setItem('user', JSON.stringify(this.user));
        }
      } else {
        sessionStorage.setItem('user', null);
      }
    });
  }
  // Sign in with Google
  GoogleAuth(): Promise<void> {
    return this.AuthLogin(new firebase.auth.GoogleAuthProvider());
  }
  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.SetUserData(result.user);
        const userRef: AngularFirestoreDocument<any> = this.afs.doc(
          `users/${result.user.uid}`
        );
        userRef.valueChanges().subscribe((x) => {
          if (x) {
            console.log('account created');
            this.user = x;
          } else {
            this.SetUserData(result.user);
          }
        });
      })
      .catch((error) => {
        window.alert(error);
      });
  }

  // async loginWithGoogle() {
  //   const res = await this.afAuth.signInWithPopup(
  //     new firebase.auth.GoogleAuthProvider()
  //   );
  //   if (res) {
  //     const userUID = res.user['uid'];
  //     const userPic = res.user['photoURL'];
  //     console.log('login success ', res.user, userUID, userPic);
  //     const userInfo = res.additionalUserInfo.profile['name'];
  //     this.loginData = res;
  //     return { userInfo, userUID, userPic };
  //   } else {
  //     console.log('fail');
  //   }
  //   // this.router.navigate(['']);
  // }
  get isLoggedIn(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user !== null;
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user): Promise<void> {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      managerList: firebase.firestore.FieldValue.arrayUnion('created'),
      groupList: firebase.firestore.FieldValue.arrayUnion('created'),
    };

    this.user = userData;

    return userRef.set(userData, {
      merge: true,
    });
  }

  get userData(): User {
    const user = this.user;
    if (user) {
      const userData: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        managerList: user.managerList || [],
        groupList: user.managerList || [],
      };
      return userData;
    }
    return;
  }
  get userUid() {
    return this.user.uid;
  }

  userCaseUpadated(caseId) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${this.user.uid}`
    );

    return userRef.update({
      managerList: firebase.firestore.FieldValue.arrayUnion(caseId),
      groupList: firebase.firestore.FieldValue.arrayUnion(caseId),
    });
  }

  // userSubmitForm(newForm){
  //   const userRef: AngularFirestoreDocument<any> = this.afs.doc(
  //     `users/${this.user.uid}/mangerList`
  //   );
  //   const mangerList: string[] = this.user.managerList.push(newForm);
  //   return userRef.set(mangerList, {
  //     merge: true,
  //   });
  // }

  async logout() {
    await this.afAuth.signOut();
    sessionStorage.removeItem('user');
    window.location.reload();
    // this.router.navigate(['']);
  }

  // get loggedInUserData(): IloggedInUserData {
  //   const { uid, displayName, photoURL } = JSON.parse(
  //     sessionStorage.getItem('user')
  //   );
  //   return { uid, userName: displayName, avatar: photoURL };
  // }
}
