import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Http } from '@angular/http';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, AfterViewInit {

  public fileList: any[];
  public searchedFor = null;

  constructor(private http: Http, private activatedRoute: ActivatedRoute) { }

  ngAfterViewInit() {

    this.activatedRoute.queryParams.subscribe((query: { q: string }) => {
      if (query.q != null && query.q.trim() !== '') {
        this.searchFiles(query.q);
      } else {
        this.getFiles();
      }
    });
  }

  ngOnInit() {
  }

  public getFiles(): any {
    this.http.get('http://localhost:3000/files/').subscribe((response) => {
      this.fileList = response.json();
      this.searchedFor = null;
    });
  }

  public searchFiles(q): any {
    this.http.get('http://localhost:3000/files/?q=' + q).subscribe((response) => {
      this.fileList = response.json();
      this.searchedFor = q;
    });
  }

}
