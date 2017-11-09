import { Injectable }    from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { ServiceLocation } from './service-location';
import { Resource } from './resource';

@Injectable()
export class AuthService {
  private svc = ServiceLocation;
  private url = this.svc[this.svc.env] + 'auth.php';
  private headers = new Headers({'Content-Type': 'application/json'});
  private user = new BehaviorSubject<Resource>(undefined); // initial value
  userChange = this.user.asObservable();
  result: Object;
  
  constructor(private http: Http) { }
  
  getSession(): Observable<Object> {
    return this.http.get(this.url)
    .map(response => this.setUser( {'USER': response.json()} ));
  }

  login(username: string, password: string): Observable<Object> {
    return this.http.post(this.url, {username: username, password: password})
    .map(response => this.setUser( response.json() ));
  }

  logout(): Observable<Object> {
    return this.http.delete(this.url)
    .map(response => this.setUser( null ));
  }

  // This allows components not directly calling login/logout/session functions
  // to subscribe to a session change. There's probably a better way but oh well
  private setUser(response: Object): Object {
    this.result = response;
    let resource = null;
    if (response) {
      resource = response['USER'];
    }
    if (resource != null) {
      this.user.next(resource);
    } else {
      this.user.next(null);
    }
    return response;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}