import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
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
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {

  public user: User = null;
  public loginForm: FormGroup;
  public searchForm: FormGroup;

  public popupVisible = false;

  private isDescendant(parent, child) {
    let node = child.parentNode;
    while (node !== null) {
      if (node === parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  public onClick($event: MouseEvent) {

    if ($event.srcElement.getAttribute('data-toggle') != 'popupLogin') {
      this.popupVisible = false;
    }
  }

  constructor(private userService: UserService, private router: Router, private activatedRoute: ActivatedRoute) {
    this.loginForm = new FormGroup({
      userName: new FormControl(''),
      password: new FormControl('')
    });
    this.searchForm = new FormGroup({
      search: new FormControl('')
    });
    this.activatedRoute.queryParams.subscribe((query: { q: string }) => {
      if (query.q != null && query.q.trim() !== '') {
        this.searchForm.controls['search'].setValue(query.q);
      } else {
        this.searchForm.controls['search'].setValue('');
      }
    });
  }

  public logout() {
    this.userService.invalidate().subscribe((user) => {
      this.user = user;
      this.router.navigate(['/']);
    });
  }

  public login() {
    const loginInfo = {
      userName: this.loginForm.controls['userName'].value,
      password: this.loginForm.controls['password'].value
    };

    this.userService.login(loginInfo.userName, loginInfo.password).subscribe((result) => {
      this.userService.verify().subscribe((user) => {
        this.user = user;
        this.loginForm.reset();
      });
    }, (error) => {
      console.error(error);
    });
  }

  public register() {
    this.router.navigate(['register']);
  }

  ngOnInit() {
    this.userService.verify().subscribe((user) => {
      this.user = user;
    });
  }

  public submitSearch() {
    const q = this.searchForm.controls['search'].value;
    let navigationExtras: NavigationExtras = {
      queryParams: { 'q': q }
    };
    this.router.navigate(['/', 'list'], navigationExtras);
  }

}
