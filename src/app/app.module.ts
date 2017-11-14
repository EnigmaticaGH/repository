import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MatInputModule,
  MatFormFieldModule,
  MatButtonModule,
  MatCheckboxModule,
  MatSelectModule,
  MatAutocompleteModule,
  MatGridListModule,
  MatNativeDateModule,
  MatDatepickerModule,
  MatCardModule,
  MatTableModule,
  MatTooltipModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatProgressBarModule,
  MatDialogModule,
  MatSnackBarModule,
  MatIconModule,
  MatChipsModule,
  MatListModule,
  MatIconRegistry
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { FileDropModule } from 'ngx-file-drop/lib/ngx-drop';

import { AppComponent } from './app.component';
import { AuthService } from './auth.service';
import { LoginModalComponent } from './login-modal/login-modal.component';
import { RepositoryComponent } from './repository/repository.component';
import { LogoutButtonComponent } from './logout-button/logout-button.component';
import { FilesizePipe } from './filesize.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LoginModalComponent,
    RepositoryComponent,
    LogoutButtonComponent,
    FilesizePipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatGridListModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatCardModule,
    MatTableModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    FileDropModule
  ],
  providers: [AuthService],
  entryComponents: [LoginModalComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer){
    matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('./assets/mdi.svg'));
  }
}