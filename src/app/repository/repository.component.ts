import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'; 
import { FileDropModule, UploadFile, UploadEvent } from 'ngx-file-drop/lib/ngx-drop';
import { RepositoryService } from './repository.service';
import { ServiceLocation } from '../service-location';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.css'],
  providers: [RepositoryService]
})
export class RepositoryComponent implements OnInit {
  files: Array<Object>;

  newFolder: boolean;
  folderName: string;
  formGroup: FormGroup;

  formGroupDelete: FormGroup;
  deleteConfirm: string;

  repo = ServiceLocation[ServiceLocation.env + '-repo'];

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private repositoryService: RepositoryService,
    private watchdog: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.formGroup = new FormGroup({
      'folderName': new FormControl('', this.validateFolderName(/^[^\\/?%*:|"<>\.]+$/))
    });
    this.newFolder = false;
    this.folderName = "";

    this.formGroupDelete = new FormGroup({
      'deleteConfirm': new FormControl('', this.validateDeleteConfirm())
    });
    this.deleteConfirm = "";

    this.route.url.subscribe(url => this.getDirectoryContent(url))
  }

  validateFolderName(regex: RegExp): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      const forbidden = !regex.test(control.value);
      return forbidden ? {'forbiddenName': {value: control.value}} : null;
    };
  }

  validateDeleteConfirm(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      const wrong = control.value !== 'delete';
      return wrong ? {'notConfirmed': {value: control.value}} : null;
    };
  }

  getDirectoryContent(url: UrlSegment[]): void {
    this.newFolder = false;
    this.folderName = "";
    let path = "";
    for(let frag of url) {
      path += '/' + frag;
    }
    this.repositoryService.get(path)
    .subscribe(files => {
      this.files = files;
      this.watchdog.detectChanges();
    });
  }

  notRoot(): boolean {
    return this.route.url['value'].length > 1;
  }

  goBack(): void {
    this.location.back();
  }

  addFolder(): void {
    if (this.formGroup.valid) {
      let url = this.route.url['value'];
      let path = "";
      for(let frag of url) {
        path += '/' + frag;
      }
      this.repositoryService.add(this.folderName, path)
      .subscribe(response => {
        this.getDirectoryContent(url);
      })
      this.newFolder = false;
      this.folderName = "";
    } 
  }

  confirmDelete(file): void {
    for(let file of this.files) {
      file['confirmDelete'] = false;
    }
    file.confirmDelete = true;
    this.watchdog.detectChanges();
  }

  delete(file): void {
    this.repositoryService.delete(file.path)
    .subscribe(response => {
      file.confirmDelete = false;
      this.deleteConfirm = "";
      this.getDirectoryContent(this.route.url['value']);
    });
  }

  cancelDelete(file): void {
    file.confirmDelete = false;
    this.deleteConfirm = "";
    this.watchdog.detectChanges();
  }
  
  dropped(event: UploadEvent) {
    let url = this.route.url['value'];
    let path = "";
    for(let frag of url) {
      path += '/' + frag;
    }
    for (var file of event.files) {
      file.fileEntry.file(info => {
        let extension = "";
        let lastDot = info.name.lastIndexOf('.');
        if (lastDot >= 0) {
          extension = info.name.substring(lastDot);
        }
        let icon = this.getIcon(extension);
        let newFile = {
          'name': info.name,
          'path': path + '/' + info.name,
          'type': 'file',
          'extension': info.extension,
          'lastModified': info.lastModified,
          'size': info.size,
          'icon': icon,
          'iconColor': this.iconColor(icon),
          'confirmDelete': false,
          'progress': 0
        };
        this.files.push(newFile);
        this.repositoryService.upload(info, path)
        .subscribe(response => {
          this.getDirectoryContent(url);
        });
        this.repositoryService.progressChange[info.name].subscribe(res => {
          newFile.progress = res;
          this.watchdog.detectChanges();
        });
      });
    }
  }

  getIcon(extension): string {
    if (extension.match(/xls/)) {
      return 'file-excel';
    } else if (extension.match(/doc/)) {
      return 'file-word';
    } else if (extension.match(/ppt/)) {
      return 'file-powerpoint';
    } else if (extension.match(/pdf/)) {
      return 'file-pdf';
    } else if (extension.match(/txt/)) {
      return 'file-document';
    } else {
      return 'file';
    }
  }

  iconColor(icon): string {
    let iconColors = {
      'file-excel': '#388E3C',
      'file-word': '#303F9F',
      'file-powerpoint': '#F57C00',
      'file-pdf': '#D32F2F',
      'file-document': '#455A64',
      'file': '#616161'
    }
    return iconColors[icon];
  }
}
