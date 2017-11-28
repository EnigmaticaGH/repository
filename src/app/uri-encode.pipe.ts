import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uriEncode'
})
export class UriEncodePipe implements PipeTransform {

  transform(value: string, args?: any): any {
    let filenameStart = value.lastIndexOf('/');
    let filename = value.substring(filenameStart + 1);
    let path = value.replace(filename, '');
    return path + encodeURIComponent(filename);
  }

}
