import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {
  waiting: boolean;
  username: string;
  password: string;
  error: string;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.error = "";
    this.waiting = false;
  }

  private login(): void {
    this.error = "";
    this.waiting = true;
    this.authService.login(this.username, this.password)
    .subscribe(response => {
      this.waiting = false;
      if (response['ERROR']) {
        this.error = response['ERROR'];
      } else {
        this.dialog.closeAll();
      }
    })
  }
}
