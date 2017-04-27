import { UserService } from './../user.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {


  public registerForm: FormGroup;
  public passwordError: boolean;

  constructor(private userService: UserService, private router: Router) {
    this.registerForm = new FormGroup({
      userName: new FormControl(''),
      password: new FormControl(''),
      passwordReentry: new FormControl(''),
      isCreator: new FormControl(''),
      avatarUrl: new FormControl('')
    });
  }

  public register() {
    if (this.registerForm.controls['password'].value !== this.registerForm.controls['passwordReentry'].value) {
      return this.passwordError = true;
    } else {
      this.passwordError = false;
    }

    console.log(this.registerForm.controls['userName'].value);

    this.userService.register(this.registerForm.controls['userName'].value,
      this.registerForm.controls['password'].value,
      this.registerForm.controls['isCreator'].value,
      this.registerForm.controls['avatarUrl'].value).subscribe((ok) => {
        if (ok) {
          this.router.navigate(['/']);
        }
      });

  }



}
