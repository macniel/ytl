import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

export interface ProcessData {
  processId: number;
  state: string;
  progress: number;
}

export interface Record {
  title: string;
  created: Date;
  filePath: string;
  posterFilePath: string;
  isImage: boolean;
  isVideo: boolean;
  isAvailable: boolean;
  processId: number;
  processInfo?: ProcessData;
};


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('#fileUpload') file: HTMLInputElement;

  public uploadForm: FormGroup;
  public fileList: Record[];
  public timer: any[] = [];

  private http: Http;
  private selectedFile: File;
  private selectedPosterFile: File;

  constructor(http: Http) {
    this.http = http;
    this.uploadForm = new FormGroup({
      file: new FormControl(''),
      title: new FormControl(''),
      poster: new FormControl('')
    });
    this.getFiles();
  }

  public updateFile($event) {
    this.selectedFile = (<any>event.srcElement).files[0];
  }

  public updatePoster($event) {
    this.selectedPosterFile = (<any>event.srcElement).files[0];
  }

  public sendForm() {
    const uploadFile = this.selectedFile;
    const formData = new FormData();
    const xhr = new XMLHttpRequest();
    console.log(uploadFile);

    formData.append('title', this.uploadForm.controls['title'].value);
    formData.append('files', this.selectedFile);
    formData.append('poster', this.selectedPosterFile);
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
      this.fileList.forEach((file) => {
        this.getProcessForFile(file);
      });
    });
  }

  public getFileSrc(fileName: string) {
    return 'http://localhost:3000/' + fileName;
  }

  public getProcessForFile(file) {
    if (this.timer[file.processId]) {
      clearInterval(this.timer[file.processId]);
    }
    this.timer[file.processId] = setInterval(() => {
      this.http.get('http://localhost:3000/upload/status/' + file.processId)
        .subscribe((response) => {
          const record: Record = response.json();
          console.log('response', response.json());
          for (let i = 0; i < this.fileList.length; ++i) {
            if (this.fileList[i].processId === record.processId) {
              this.fileList[i] = record;
              if (record.isAvailable === true) {
                clearInterval(this.timer[file.processId]);
              }
              break;
            }
          }

        });
    }, 1000);
  }

}
