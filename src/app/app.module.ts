import { UserService } from './user.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { StudioComponent } from './studio/studio.component';
import { ListComponent } from './list/list.component';
import { RegisterComponent } from './register/register.component';
import { ViewComponent } from './view/view.component';
import { VideoItemComponent } from './video-item/video-item.component';


const appRoutes: Routes = [
  { path: 'create', component: StudioComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'watch/:id', component: ViewComponent },
  { path: '**', component: ListComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    StudioComponent,
    ListComponent,
    RegisterComponent,
    ViewComponent,
    VideoItemComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes)

  ],
  providers: [UserService],
  bootstrap: [AppComponent]
})
export class AppModule { }
