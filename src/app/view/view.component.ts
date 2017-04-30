import { Observable } from 'rxjs/Observable';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  tags: any;
  ownerName: string;
  relatedFiles: { score: number, id: string }[];
};
@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements AfterViewInit {
  public file: Record;
  public relatedVideos: any[] = [];

  private interval: any;
  private timeCode: String = '0:00';


  constructor(private activatedRoute: ActivatedRoute, private http: Http, private router: Router) {
  }

  ngAfterViewInit() {

    this.activatedRoute.params.subscribe((routeInfo: { id: string }) => {
      this.http.get('http://localhost:3000/files/watch/' + routeInfo.id).subscribe((file) => {
        this.file = file.json();
        this.getRelatedVideos().subscribe((videos) => {
          console.log(videos);
          this.relatedVideos = videos;
        });
      });
    })
  }

  getFileSrc(file: Record) {
    return 'http://localhost:3000/' + file.filePath;
  }

  getPosterFileSrc(file: Record) {
    return 'http://localhost:3000/' + file.posterFilePath;
  }

  // media controls

  goFullscreen() {
    const video = document.querySelector('#video');
    video.requestFullscreen();
  }

  isPaused() {
    const video = document.querySelector('#video');
    return (<any>video).paused;
  }

  calculateTimeCode() {
    const video = <any>document.querySelector('#video');
    const currentTime = video.currentTime;
    let cT = Math.floor(currentTime % 60);
    let secString = cT <= 9 ? '0' + cT : cT;

    this.timeCode = Math.floor(currentTime / 60) + ":" + secString;
  }

  playOrPause() {
    const video = document.querySelector('#video');
    if (this.isPaused()) {
      (<any>video).play();

      this.interval = setInterval(() => {
        this.calculateTimeCode();
      }, 200);
    } else {
      (<any>video).pause();
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
  }

  skipPrevious() {
    const video = <any>document.querySelector('#video');
    video.currentTime -= 10;
    this.calculateTimeCode();
  }

  skipNext() {
    const video = <any>document.querySelector('#video');
    video.currentTime += 10;
    this.calculateTimeCode();
  }

  getTags() {
    if (!this.file) {
      return [];
    } else {
      return this.file.tags;
    }
  }



  getRelatedVideos() {
    return this.http.get('http://localhost:3000/files/').map((response) => {
      const videos = response.json();
      const basket = [];
      this.file.relatedFiles = this.file.relatedFiles.sort((a, b) => {
        return b.score - a.score;
      });

      for (const relatedFile of this.file.relatedFiles) {
        for (const video of videos) {

          if (relatedFile.id === video.videoId) {
            basket.push(video);
          }
        }

      }
      return basket;
    });
  }

}
