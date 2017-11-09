import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-logout-button',
  templateUrl: './logout-button.component.html',
  styleUrls: ['./logout-button.component.css']
})
export class LogoutButtonComponent implements OnInit {
  @Output() authChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private dialog: MatDialog,
    private authSnack: MatSnackBar,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authChange.emit(false);
    this.authService.userChange.subscribe(user => {
      if (user) {
        this.authChange.emit(true);
        this.authSnack.open('Successfully logged in!', 'Got it', {duration: 2000});
      } else {
        this.authChange.emit(false);
      }
    });
    this.authService.getSession()
    .subscribe(response => {
      if (!response['USER']) {
        this.showLoginDialog();
      }
    });
  }

  showLoginDialog(): void {
    let dialogRef = this.dialog.open(LoginModalComponent, {
      width: '500px',
      disableClose: true
    });
  }
  
  logout(): void {
    this.authService.logout()
    .subscribe(response => {
      this.authSnack.open('Successfully logged out!', 'Got it', {duration: 2000});
      this.showLoginDialog();
    });
  }
}
