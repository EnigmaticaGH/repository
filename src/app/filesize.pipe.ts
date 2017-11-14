import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filesize'
})
export class FilesizePipe implements PipeTransform {

  transform(value: number, args?: any): string {
    let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let base = 1024;
    let byteSize = null;
    for (let i = 0; i < sizes.length ; i++) {
      let type = sizes[i];
      let sizeInType: number = value / Math.pow(base, i);
      if (sizeInType < 1024 && !byteSize) {
        byteSize = sizeInType.toFixed(1) + ' ' + type;
      }
    }
    return byteSize;
  }

}
