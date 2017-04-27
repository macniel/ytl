import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptionsArgs } from '@angular/http';
import 'rxjs/add/observable/of';
export interface User {
  userId: string;
  isCreator: boolean;
  userName: string;
  avatar: string;
  isLoggedIn: boolean;
}

@Injectable()
export class UserService {

  constructor(private http: Http) { }

  private wsLogin(userName, password) {
    console.log('wsLogin called');
    console.log(sessionStorage.getItem('token'));
    if (sessionStorage.getItem('token') != null) {
      return Observable.of(null);
    } else {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      const opts: RequestOptionsArgs = { headers: headers };

      return this.http.post('http://localhost:3000/login', { userName: userName, password: password }, opts).map((result) => {
        const token = result.json().token;
        sessionStorage.setItem('token', token);
        console.log(token);
        return token;
      }, (error) => {
        console.error(error);
        return null;
      });
    }
  }

  private wsRegister(userName, password, isCreator, avatarUrl) {

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const opts: RequestOptionsArgs = { headers: headers };

    return this.http.post('http://localhost:3000/register', { userName: userName, password: password, isCreator: isCreator, avatarUrl: avatarUrl }, opts).map((result) => {
      return true;
    }, (error) => {
      return false;
    });

  }

  private wsVerify() {

    const headers = new Headers();
    headers.append('x-access-token', sessionStorage.getItem('token'));
    headers.append('Content-Type', 'application/json');
    const opts: RequestOptionsArgs = { headers: headers };

    return this.http.get('http://localhost:3000/user', opts).map((result) => {
      const user = result.json();
      user.isLoggedIn = true;
      return user;
    }, (error) => {
      console.error(error);
      return {
        userId: '-1',
        isCreator: false,
        userName: 'anonymous',
        avatar: '',
        isLoggedIn: false
      };
    });

  }

  public verify(): Observable<User> {
    return this.wsVerify();
  }

  public register(userName, password, isCreator, avatarUrl): Observable<boolean> {
    return this.wsRegister(userName, password, isCreator, avatarUrl);
  }

  public login(userName, password): Observable<any> {
    console.log('login called');
    return this.wsLogin(userName, password);
  }

}
