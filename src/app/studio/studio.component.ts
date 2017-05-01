import { environment } from './../../environments/environment';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Http, RequestOptionsArgs, Headers } from '@angular/http';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';

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
  processId: string;
  videoId: string;
  processInfo?: ProcessData;
};

@Component({
  selector: 'app-studio',
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css']
})
export class StudioComponent implements OnDestroy {

  @ViewChild('#fileUpload') file: HTMLInputElement;

  public uploadForm: FormGroup;
  public fileList: Record[];
  public timer: any = {};

  public posterPath = 'assets/video_placeholder.png';

  private http: Http;
  private sanitizer: DomSanitizer;
  private selectedFile: File;
  private selectedPosterFile: File;

  constructor(http: Http, sanitizer: DomSanitizer) {
    this.http = http;
    this.sanitizer = sanitizer;
    this.uploadForm = new FormGroup({
      file: new FormControl(''),
      title: new FormControl(''),
      poster: new FormControl(''),
      tags: new FormControl('')
    });
    this.getFiles();
  }

  public updateFile($event) {
    this.selectedFile = (<any>event.srcElement).files[0];
  }

  public updatePoster($event) {
    this.selectedPosterFile = (<any>event.srcElement).files[0];


    if (this.selectedPosterFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedPosterFile);
      reader.onload = (e) => {
        // browser completed reading file - display it
        this.posterPath = (<any>e.target).result;
      };
    }

  }

  public sendForm() {
    const uploadFile = this.selectedFile;
    const formData = new FormData();
    const xhr = new XMLHttpRequest();

    formData.append('title', this.uploadForm.controls['title'].value);
    formData.append('files', this.selectedFile);
    formData.append('poster', this.selectedPosterFile);
    formData.append('tags', this.uploadForm.controls['tags'].value);
    console.log(this.uploadForm.controls['tags'].value.split(';'));
    xhr.open('POST', environment.API_URL + '/upload');
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
    const headers = new Headers();
    headers.append('x-access-token', sessionStorage.getItem('token'));
    headers.append('Content-Type', 'application/json');
    const opts: RequestOptionsArgs = { headers: headers };
    this.http.get(environment.API_URL + '/uploads/', opts).subscribe((response) => {

      this.fileList = response.json() == null ? [] : response.json();
      this.fileList.forEach((file) => {
        this.getProcessForFile(file);
      });
    });
  }

  public getFileSrc(fileName: string) {
    if (!fileName) {
      return 'assets/video_placeholder.png';
    } else {
      return environment.API_URL + '/' + fileName;
    }
  }

  public getProcessForFile(file) {
    const id = !file.processId ? file.videoId : file.processId;
    if (this.timer[id]) {
      clearInterval(this.timer[id]);
    }
    this.timer[id] = setInterval(() => {

      const headers = new Headers();
      headers.append('x-access-token', sessionStorage.getItem('token'));
      headers.append('Content-Type', 'application/json');
      const opts: RequestOptionsArgs = { headers: headers };

      this.http.get(environment.API_URL + '/upload/status/' + file.processId, opts)
        .subscribe((response) => {
          const record: Record = response.json();

          for (let i = 0; i < this.fileList.length; ++i) {
            if (this.fileList[i].processId === record.videoId || this.fileList[i].videoId === record.videoId) {
              this.fileList[i] = record;
              if (record.isAvailable === true) {
                clearInterval(this.timer[id]);
              }
              break;
            }
          }

        });
    }, 1000);
  }


  getImage() {
    return this.sanitizer.bypassSecurityTrustStyle('url(\'' + this.posterPath + '\')');
  }

  public ngOnDestroy(): void {
    for (const timer of this.timer) {
      console.log(timer);
      clearInterval(timer);
    }
  }

}
