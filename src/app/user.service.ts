import { environment } from './../environments/environment.prod';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptionsArgs } from '@angular/http';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import 'rxjs/add/observable/of';


export interface User {
  userId: string;
  isCreator: boolean;
  userName: string;
  avatar: string;
  isLoggedIn: boolean;
}

@Injectable()
export class UserService implements CanActivate {


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    return this.wsVerify().map((result) => {
      return result.isLoggedIn;
    });

  }

  canActivateCreator(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.wsVerify().map((result) => {
      return result.isLoggedIn && result.isCreator;
    });
  }

  constructor(private http: Http) { }

  private wsLogin(userName, password) {
    if (sessionStorage.getItem('token') != null) {
      return Observable.of(null);
    } else {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      const opts: RequestOptionsArgs = { headers: headers };

      return this.http.post(environment.API_URL + '/login', { userName: userName, password: password }, opts).map((result) => {
        const token = result.json().token;
        sessionStorage.setItem('token', token);
        return token;
      }, (error) => {
        return null;
      });
    }
  }

  private wsRegister(userName, password, isCreator, avatarUrl) {

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const opts: RequestOptionsArgs = { headers: headers };

    return this.http.post(environment.API_URL + '/register', { userName: userName, password: password, isCreator: isCreator, avatarUrl: avatarUrl }, opts).map((result) => {
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

    return this.http.get(environment.API_URL + 'user', opts).map((result) => {
      const user = result.json();
      user.isLoggedIn = true;
      return user;
    }, (error) => {
      return {
        userId: '-1',
        isCreator: false,
        userName: 'anonymous',
        avatar: '',
        isLoggedIn: false
      };
    });

  }

  public invalidate() {
    sessionStorage.removeItem('token');

    return Observable.of({
      userId: '-1',
      isCreator: false,
      userName: 'anonymous',
      avatar: '',
      isLoggedIn: false
    });
  }

  public verify(): Observable<User> {
    return this.wsVerify();
  }

  public register(userName, password, isCreator, avatarUrl): Observable<boolean> {
    return this.wsRegister(userName, password, isCreator, avatarUrl);
  }

  public login(userName, password): Observable<any> {
    return this.wsLogin(userName, password);
  }

}
