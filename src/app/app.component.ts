import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title: string;
  loggedIn: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.title = 'DO Substations - Data Repository';
  }
}
