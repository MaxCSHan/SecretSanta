import { ShowresultComponent } from './showresult/showresult.component';
import { RegisterComponent } from './register/register.component';
import { EventpageComponent } from './eventpage/eventpage.component';
import { MyaccountComponent } from './myaccount/myaccount.component';
import { MygroupComponent } from './mygroup/mygroup.component';
import { GeneratorComponent } from './generator/generator.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
const routes: Routes = [
  { path: '', component: GeneratorComponent },
  { path: 'account', component: MyaccountComponent },
  { path: 'groups', component: MygroupComponent },
  {
    path: 'overview',
    children: [{ path: ':gid/:uid', component: EventpageComponent }],
  },
  {
    path: 'register',
    children: [{ path: ':gid', component: RegisterComponent }],
  },
  {
    path: 'show-result',
    children: [{ path: ':gid', component: ShowresultComponent }],
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
