import { EventpageComponent } from './eventpage/eventpage.component';
import { MyprofileComponent } from './myprofile/myprofile.component';
import { MygroupComponent } from './mygroup/mygroup.component';
import { GeneratorComponent } from './generator/generator.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', component: GeneratorComponent },
  { path: 'account', component: MyprofileComponent },
  { path: 'groups', component: MygroupComponent },
  { path: 'overview', children: [{ path: ':gid/:uid', component: EventpageComponent }] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
