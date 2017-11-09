import { LoginModalComponent } from './login-modal/login-modal.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AuthService } from './auth.service';

export function showLoginDialog(dialog: MatDialog): void {
  let dialogRef = dialog.open(LoginModalComponent, {
    width: '500px',
    disableClose: true
  });
}

export function logout(dialog: MatDialog, authService: AuthService): void {
  authService.logout()
  .subscribe(response => {
    showLoginDialog(dialog);
  });
}