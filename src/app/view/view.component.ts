import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
export interface Record {
  title: string;
  created: Date;
  filePath: string;
  posterFilePath: string;
  isImage: boolean;
  isVideo: boolean;
  isAvailable: boolean;
  processId: number;
};
@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements AfterViewInit {
  public file: Record;

  constructor(private activatedRoute: ActivatedRoute, private http: Http) { }

  ngAfterViewInit() {
    this.activatedRoute.params.subscribe((routeInfo: { id: string }) => {
      this.http.get('http://localhost:3000/files/watch/' + routeInfo.id).subscribe((file) => {
        this.file = file.json();
      });
    })
  }

  getFileSrc(file:Record) {
    return 'http://localhost:3000/' + file.filePath;
  }

  getPosterFileSrc(file:Record) {
    return 'http://localhost:3000/' + file.posterFilePath;
  }

}
