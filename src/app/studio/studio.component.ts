import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Http } from '@angular/http';

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
  videoId: string;
  processInfo?: ProcessData;
};

@Component({
  selector: 'app-studio',
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css']
})
export class StudioComponent {

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

    formData.append('title', this.uploadForm.controls['title'].value);
    formData.append('files', this.selectedFile);
    formData.append('poster', this.selectedPosterFile);
    xhr.open('POST', 'http://localhost:3000/upload');
    xhr.setRequestHeader('x-access-token', sessionStorage.getItem('token'));
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
    if (this.timer[file.videoId]) {
      clearInterval(this.timer[file.videoId]);
    }
    this.timer[file.videoId] = setInterval(() => {
      this.http.get('http://localhost:3000/upload/status/' + file.videoId)
        .subscribe((response) => {
          const record: Record = response.json();
          for (let i = 0; i < this.fileList.length; ++i) {
            if (this.fileList[i].videoId === record.videoId) {
              this.fileList[i] = record;
              if (record.isAvailable === true) {
                clearInterval(this.timer[file.videoId]);
              }
              break;
            }
          }

        });
    }, 1000);
  }

}
