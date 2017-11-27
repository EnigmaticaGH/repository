import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router'; 
import { FileDropModule, UploadFile, UploadEvent } from 'ngx-file-drop';
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

    this.uploadingFiles = [];
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
    // Prune uploaded folders from in-progress list
    this.uploadingFiles = this.uploadingFiles.filter((el) => {
      return el['progress'] < 100 || el['error'];
    });
    // Prune uploaded folders from in-progress list
    this.uploadingFolders = this.uploadingFolders.filter((el) => {
      return el['progress'] < el['size'];
    });
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
      });
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
    let filename = movedFile['name'] + '.' + movedFile['extension'];
    if (movedFile['type'] === 'folder') {
      filename = movedFile['name'];
    }
    let oldPath = movedFile['path'].replace(filename, '');
    let newPath = oldPath + folder['name'] + '/' + filename;
    this.move(movedFile['path'], newPath);
  }

  moveFileUp($event): void {
    $event.preventDefault();
    if (this.notRoot()) {
      let movedFile = JSON.parse($event.dataTransfer.getData("text"));
      // Strip filename from current path and preserve the file path
      let filename = movedFile['name'] + '.' + movedFile['extension'];
      if (movedFile['type'] === 'folder') {
        filename = movedFile['name'];
      }
      let oldPath = movedFile['path'].replace('/' + filename, '');
      let pathParts = oldPath.split('/');
      pathParts.splice(-1,1); // Remove the deepest path part to move the path up once in the dir tree
      let newPath = pathParts.join('/') + '/' + filename;
      this.move(movedFile['path'], newPath);
    } else {
      
    }
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
    console.log(event);
    for (var file of event.files) {
      let pathParts = file.relativePath.split('/');
      pathParts.splice(-1, 1);
      let relativePath = pathParts.join('/');
      if (file.fileEntry.file) {
        file.fileEntry.file(info => {
          this.uploadFile(info, path, relativePath);
        });
      } else {
        //console.log(relativePath);
      }
    }
  }

  private uploadFile(info, path, relativePath): void {
    let dotIdx = info.name.lastIndexOf('.');
    let name = info.name.substring(0, dotIdx);
    let extension = info.name.substring(dotIdx + 1);
    let icon = this.getIcon(extension);
    let color = this.iconColor(icon);
    let type = relativePath == "" ? 'file' : 'folder';
    if (type === 'folder') {
      // uploadFolders are for display only, to show
      // upload progress of folders
      // Only top-level folders are included
      let relPathFirstLvl = relativePath.split('/')[0];
      let folderExists = this.uploadingFolders.find((el) => {
        return el['name'] === relPathFirstLvl;
      });
      if (folderExists && relPathFirstLvl === folderExists['name']
      && info.size <= 125000000) { // 125 MB size limit
        folderExists['fileCount']++;
        folderExists['size'] += info['size'];
      } else {
        this.uploadingFolders.push({
          'name': relPathFirstLvl,
          'fileCount': 0,
          'progress': 0,
          'size': 0,
          'errors': 0
        });
      }
      info['folder'] = relPathFirstLvl;
    }
    if (type === 'file') {
      this.uploadingFiles.push({
        'name': name,
        'id': info.name,
        'path': relativePath,
        'extension': extension,
        'icon': icon,
        'iconColor': color,
        'progress': 0,
        'size': info['size']
      });
    }
    this.repositoryService.upload(info, path, relativePath)
    .subscribe(response => {
      if (response['error']) {
        let file = this.uploadingFiles.find((el) => {
          return el['id'] == info.name;
        });
        if (file) {
          file['error'] = response['error'];
          // Remove errored file after 5 seconds
          setTimeout(() => {
            this.uploadingFiles = this.uploadingFiles.filter((el) => {
              return el['name'] !== file['name'];
            });
            this.watchdog.detectChanges();
          }, 5000);
        }
        let folder = this.uploadingFolders.find((el) => {
          return el['name'] == info.folder;
        });
        if (folder) {
          folder['errors']++;
        }
      }
      this.getDirectoryContent(this.route.url['value']);
    });
    var oldProgress = 0;
    this.repositoryService.progressChange[relativePath + info.name].subscribe(res => {
      if (type === 'file') {
        let file = this.uploadingFiles.find((el) => {
          return el['id'] == info.name;
        });
        if (file) {
          file['progress'] = res;
        }
      } else {
        var newProgress = res;
        var progressDiff = newProgress - oldProgress;
        let folder = this.uploadingFolders.find((el) => {
          return el['name'] == info.folder;
        });
        if (folder) {
          folder['progress'] += info.size * (progressDiff / 100);
        }
        oldProgress = res;
      }
      this.watchdog.detectChanges();
    });
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
    } else if (extension.match(/doc/i)) {
      return 'file-word';
    } else if (extension.match(/ppt/i)) {
      return 'file-powerpoint';
    } else if (extension.match(/pdf/i)) {
      return 'file-pdf';
    } else if (extension.match(/vsd/i)) {
      return 'file-chart';
    } else if (extension.match(/jpe?g|png|gif|bmp|tif|webp/i)) {
      return 'file-image';
    } else if (extension.match(/txt/i)) {
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
      'file-chart': '#512DA8',
      'file-image': '#0097A7',
      'file-document': '#455A64',
      'file': '#616161'
    }
    return iconColors[icon];
  }

  getFromFileState(state): string {
    let icons = {
      'none': 'checkbox-blank-outline',
      'selected': 'checkbox-marked',
      'rename': 'rename-box'
    };
    return icons[state];
  }
}
