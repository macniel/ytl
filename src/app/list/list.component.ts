import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
export interface Record {
  title: string;
  created: Date;
  filePath: string;
  posterFilePath: string;
  isImage: boolean;
  isVideo: boolean;
  isAvailable: boolean;
  videoId: string;
  timemark: number;
};

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  public fileList: Record[];

  constructor(private http: Http) { }

  ngOnInit() {
    this.getFiles();
  }


  public getFileSrc(fileName: string) {
    return 'http://localhost:3000/' + fileName;
  }

  public getFiles(): any {
    this.http.get('http://localhost:3000/files/').subscribe((response) => {
      this.fileList = response.json();
    });
  }

  public getTimemark(file) {
      const minutes = Math.floor(file.timemark / 60);
      const seconds = Math.floor(file.timemark % 60);
      const secondsString = (seconds <= 9 ? "0" + seconds : seconds);

      return minutes + ":" + secondsString; 
  }

}
