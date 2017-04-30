import { Component, Input } from '@angular/core';
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
  selector: 'app-video-item',
  templateUrl: './video-item.component.html',
  styleUrls: ['./video-item.component.css'],
    host: {'class': 'card'}
})
export class VideoItemComponent {

  @Input() file: Record = null;

  constructor() { }

  public getFileSrc() {
    return 'http://localhost:3000/' + this.file.posterFilePath;
  }

  public getTimemark() {
    const minutes = Math.floor(this.file.timemark / 60);
    const seconds = Math.floor(this.file.timemark % 60);
    const secondsString = (seconds <= 9 ? '0' + seconds : seconds);

    return minutes + ':' + secondsString;
  }


}
