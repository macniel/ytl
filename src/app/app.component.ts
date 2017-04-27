import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Component, ViewChild, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { UserService, User } from './user.service';

import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public user: User = null;
  public loginForm: FormGroup;
  public popupVisible = false;

  constructor(private userService: UserService) {
    this.loginForm = new FormGroup({
      userName: new FormControl(''),
      password: new FormControl('')
    });
  }

  public login() {
    const loginInfo = {
      userName: this.loginForm.controls['userName'].value,
      password: this.loginForm.controls['password'].value
    };

    this.userService.login(loginInfo.userName, loginInfo.password).subscribe((result) => {
      console.log(result);
      this.userService.verify().subscribe((user) => {
        this.user = user;
      });
    }, (error) => {
      console.error(error);
    });
  }

  ngOnInit() {
    this.userService.verify().subscribe((user) => {
      this.user = user;
    });
  }

}
