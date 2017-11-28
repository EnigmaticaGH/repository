import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { ServiceLocation } from '../service-location';

@Injectable()
export class RepositoryService {
  private svc = ServiceLocation;
  private url = this.svc[this.svc.env] + 'repository.php';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});
  private progress: Object;
  progressChange: Object;
  
  constructor(private http: Http) {
    this.progress = [];
    this.progressChange = [];
  }
  
  get(path: string): Observable<Array<Object>> {
    return this.http.get(this.url, {params: {path: path}})
    .map(res => res.json().content);
  }

  add(folder: string, path: string): Observable<boolean> {
    return this.http
    .put(this.url, JSON.stringify({
      'type': 'add',
      'folder': folder,
      'path': path
    }), {headers: this.headers})
    .map(res => res.json());
  }

  move(oldPath: string, newPath: string): Observable<boolean> {
    return this.http
    .put(this.url, JSON.stringify({
      'type': 'move',
      'oldPath': oldPath,
      'newPath': newPath
    }), {headers: this.headers})
    .map(res => res.json());
  }

  upload(file: File, path: string, relativePath: string): Observable<any> {
    this.progress[relativePath + file.name] = new BehaviorSubject<number>(0);
    this.progressChange[relativePath + file.name] = this.progress[relativePath + file.name].asObservable();
    return Observable.create(observer => {
      if (file.size > 125000000) { // 125MB
        this.progress[relativePath + file.name].next(100);
        this.progress[relativePath + file.name].complete();
        observer.next({error: 'Exceeds 125 MB filesize limit.'});
        observer.complete();
      } else {
        let formData: FormData = new FormData()
        let xhr: XMLHttpRequest = new XMLHttpRequest();
        formData.append('file', file, file.name);
        formData.append('path', path);
        formData.append('relativePath', relativePath);
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              observer.next(JSON.parse(xhr.response));
              this.progress[relativePath + file.name].complete();
              observer.complete();
            } else {
              observer.error(xhr.response);
            }
          }
        };
        xhr.upload.onprogress = (event) => {
          this.progress[relativePath + file.name].next(Math.round(event.loaded / event.total * 100));
        };
  
        xhr.open('POST', this.url, true);
        xhr.send(formData);
      }
    });
  }

  delete(path: string): Observable<boolean> {
    return this.http
    .delete(this.url + "?path=" + encodeURIComponent(path), {headers: this.headers})
    .map(res => res.json());
  }
}