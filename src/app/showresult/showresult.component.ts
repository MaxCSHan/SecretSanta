import { IEventUser } from './../interface/ievent-user';
import { FirestoreService } from './../firestore.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-showresult',
  templateUrl: './showresult.component.html',
  styleUrls: ['./showresult.component.scss']
})
export class ShowresultComponent implements OnInit {
  data: IEventUser[];
  gid: string;

  constructor(
    private firestoreService: FirestoreService,
    private angularFirestore: AngularFirestore,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe((params) => {
      // console.log('params :',params);
      if (params.gid) {
        this.gid = params.gid;
        this.firestoreService.getDraws(params.gid).then((x) => {
          x.subscribe((ele) => {
            const holder: IEventUser[] = ele;
            // console.log(holder);
            this.data = holder;
            console.log(this.data);
          });
        });
      }
    });
   }

  ngOnInit(): void {
  }
  switch(){
    this.data.pop();
    // this.data.push(this.data.shift());
  }
}
