import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  public fileList: any[];

  constructor(private http: Http) { }

  ngOnInit() {
    this.getFiles();
  }

  public getFiles(): any {
    this.http.get('http://localhost:3000/files/').subscribe((response) => {
      this.fileList = response.json();
    });
  }

}
