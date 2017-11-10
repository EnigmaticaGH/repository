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
  uploadingFiles: Array<Object>;
  uploadingFolders: Array<Object>;

  newFolder: boolean;
  folderName: string;
  formGroup: FormGroup;

  repo = ServiceLocation[ServiceLocation.env + '-repo'];

  confirmDelete: boolean = false;
  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private repositoryService: RepositoryService,
    private watchdog: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.files = [];
    this.formGroup = new FormGroup({
      'folderName': new FormControl('', this.validateFolderName())
    });
    this.newFolder = false;
    this.folderName = "";

    this.uploadingFolders = [];

    this.route.url.subscribe(url => this.getDirectoryContent(url));
  }

  validateFolderName(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      const forbidden = !/^[^\\/?%*:|"<>\.]+$/.test(control.value);
      return forbidden ? {'forbiddenName': {value: control.value}} : null;
    };
  }

  getDirectoryContent(url: UrlSegment[]): void {
    this.uploadingFiles = [];
    this.newFolder = false;
    this.folderName = "";
    let path = "";
    for(let frag of url) {
      path += '/' + frag;
    }
    this.repositoryService.get(path)
    .subscribe(files => {
      this.files = files;
      for(let file of this.files) {
        if (file['type'] === 'file') {
          let icon = this.getIcon(file['extension']);
          let iconColor = this.iconColor(icon);
          file['icon'] = icon;
          file['iconColor'] = iconColor;
        }
        file['state'] = 'none';
      }
      this.watchdog.detectChanges();
    });
  }

  notRoot(): boolean {
    let pathDepth = this.route.url['value'].length;
    return pathDepth > 1;
  }

  fileInState(state: string): boolean {
    let isInState = false;
    for(let file of this.files) {
      if (file['state'] === state) {
        isInState = true;
      }
    }
    return isInState;
  }

  goBack(): void {
    this.location.back();
  }

  addFolder(): void {
    if (this.formGroup.valid) {
      let path = this.getUrl();
      this.repositoryService.add(this.folderName, path)
      .subscribe(response => {
        this.getDirectoryContent(this.route.url['value']);
      })
      this.newFolder = false;
      this.folderName = "";
    } 
  }

  fileDrag($event, file): void {
    $event.dataTransfer.setData("text/plain", JSON.stringify(file));
  }

  checkFile($event): void {
    $event.preventDefault();
    $event.dataTransfer.dropEffect = "move";
  }

  moveFile($event, folder): void {
    $event.preventDefault();
    let movedFile = JSON.parse($event.dataTransfer.getData("text"));
    // Strip filename from current path and preserve the file path
    let oldPath = movedFile['path'].replace(movedFile['name'] + '.' + movedFile['extension'], '');
    let newPath = oldPath + folder['name'] + '/' + movedFile['name'] + '.' + movedFile['extension'];
    this.move(movedFile['path'], newPath);
  }

  moveFileUp($event): void {
    $event.preventDefault();
    let movedFile = JSON.parse($event.dataTransfer.getData("text"));
    // Strip filename from current path and preserve the file path
    let oldPath = movedFile['path'].replace('/' + movedFile['name'] + '.' + movedFile['extension'], '');
    let pathParts = oldPath.split('/');
    pathParts.splice(-1,1); // Remove the deepest path part to move the path up once in the dir tree
    let newPath = pathParts.join('/') + '/' + movedFile['name'] + '.' + movedFile['extension'];
    this.move(movedFile['path'], newPath);
  }

  private move(oldPath: string, newPath: string): void {
    this.repositoryService.move(oldPath, newPath)
    .subscribe(response => {
      console.log(response);
      this.getDirectoryContent(this.route.url['value']);
    });
  }

  rename(file): void {
    if (!this.formGroup.controls.folderName.hasError('forbiddenName')) {
      let path = file['path'];
      let pathParts = path.split('/');
      pathParts.splice(-1,1); // remove filename from path
       // add new filename to path
      if (file.type === 'file') {
        pathParts.push(file['name'] + '.' + file['extension']);
      } else if (file.type === 'folder') {
        pathParts.push(file['name']);
      }
      
      let newPath = pathParts.join('/');
      file.state = 'none';
      this.move(file['path'], newPath);
    }
  }

  toggle(file): void {
    let states = ['none', 'selected', 'rename'];
    // increment the state
    file['state'] = states[(states.indexOf(file['state']) + 1) % states.length];
    if (file['state'] === 'rename') {
      this.newFolder = false;
      file['oldName'] = file['name'];
      // mark all other files to not renaming
      for(let otherFile of this.files) {
        if (otherFile !== file && otherFile['state'] === 'rename') {
          otherFile['state'] = 'none';
        }
      }
    }
    this.watchdog.detectChanges();
  }

  goto(folder): void {
    this.router.navigate([folder.path]);
  }

  delete(): void {
    this.confirmDelete = false;
    let selectedFiles = this.files.filter((el) => {
      return el['state'] === 'selected';
    })
    for(let file of selectedFiles) {
      this.repositoryService.delete(file['path'])
      .subscribe(response => {
        this.getDirectoryContent(this.route.url['value']);
      });
    }
  }

  dropped(event: UploadEvent) {
    let path = this.getUrl();
    for (var file of event.files) {
      let pathParts = file.relativePath.split('/');
      pathParts.splice(-1, 1);
      let relativePath = pathParts.join('/');
      file.fileEntry.file(info => {
        let dotIdx = info.name.lastIndexOf('.');
        let name = info.name.substring(0, dotIdx);
        let extension = info.name.substring(dotIdx + 1);
        let icon = this.getIcon(extension);
        let color = this.iconColor(icon);
        let type = relativePath == "" ? 'file' : 'folder';
        let uploadFile = {
          'name': name,
          'path': relativePath,
          'extension': extension,
          'icon': icon,
          'iconColor': color,
          'progress': 0
        };
        // uploadFolders are for display only, to show
        // upload progress of folders
        // Only top-level folders are included
        let relPathFirstLvl = relativePath.split('/')[0];
        let uploadFolder: Object = {
          'name': relPathFirstLvl,
          'fileCount': 0,
          'progress': 0
        };
        let folderExists = this.uploadingFolders.find((el) => {
          return el['name'] === relPathFirstLvl;
        });
        if (folderExists) {
          uploadFolder = folderExists;
        } else {
          this.uploadingFolders.push(uploadFolder);
        }
        info['folder'] = relPathFirstLvl;
        if (relPathFirstLvl === uploadFolder['name']) {
          uploadFolder['fileCount']++;
        }
        if (type === 'file') {
          this.uploadingFiles.push(uploadFile);
        }
        this.repositoryService.upload(info, path, uploadFile.path)
        .subscribe(response => {
          this.getDirectoryContent(this.route.url['value']);
        });
        this.repositoryService.progressChange[uploadFile.path + info.name].subscribe(res => {
          if (type === 'file') {
            uploadFile.progress = res;
          } else {
            if (res === 100) {
              let folder = this.uploadingFolders.find((el) => {
                return el['name'] == info.folder;
              });
              if (folder) {
                folder['progress']++;
              }
              // Prune uploaded folders from in-progress list
              this.uploadingFolders = this.uploadingFolders.filter((el) => {
                return el['progress'] < el['fileCount'];
              });
            }
          }
          this.watchdog.detectChanges();
        });
      });
    }
  }

  private getUrl(): string {
    let url = this.route.url['value'];
    let path = "";
    for(let frag of url) {
      path += '/' + frag;
    }
    return path;
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
