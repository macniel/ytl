import { ReactiveFormsModule } from '@angular/forms';
import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { UploadItem } from 'angular2-http-file-upload';
import { Uploader } from 'angular2-http-file-upload';


export class FileUploadItem extends UploadItem {
  constructor(file: any) {
    super();
    this.url = 'http://localhost:3000/upload';
    this.file = file;
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  @ViewChild('#fileUpload') file: HTMLInputElement;

  private http: Http;
  public uploadForm: FormGroup;
  private selectedFile: File;
  private uploader: Uploader;
  public fileList: string[];

  constructor(http: Http, uploader: Uploader) {
    this.http = http;
    this.uploader = uploader;
    this.uploadForm = new FormGroup({
      file: new FormControl(''),
      title: new FormControl('')
    });
    this.getFiles();
  }

  public updateFile($event) {
    this.selectedFile = (<any>event.srcElement).files[0];
  }

  public sendForm() {
    const uploadFile = this.selectedFile;
    console.log(uploadFile);

    var formData = new FormData();
    formData.append('title', this.uploadForm.controls['title'].value);
    formData.append('files', this.selectedFile);

    console.log(formData);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/upload');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status <= 299) {
        this.getFiles();
        this.uploadForm.reset();
      } else if (xhr.readyState === 4 && xhr.status >= 300) {
        console.error(xhr.responseText);
      }
    };
    xhr.send(formData);
  }

  public getFiles(): any {
    this.http.get('http://localhost:3000/files/').subscribe((response) => {
      this.fileList = response.json();
    });
  }

  public getFileSrc(fileName: string) {
    return 'http://localhost:3000/' + fileName;
  }

}
