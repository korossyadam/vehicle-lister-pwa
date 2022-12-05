import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { db } from '../db';
import { Car } from '../models/car.model';
import { Observable, Observer, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-car',
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css']
})
export class CarComponent {

  public currentCarIndex: number;
  public currentCar: Car;

  // PWA variables
  public isOnline: boolean;
  public offlineSrc;

  constructor(private router: Router, private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.currentCarIndex = parseInt(this.route.snapshot.paramMap.get('index'));
    this.createOnline$().subscribe(isOnline => this.isOnline = isOnline);

    // Get Car information from indexedDB according to route parameter
    db.storedCars.where('carIndex').equals(this.currentCarIndex).first().then(res => {
      this.currentCar = res;
      this.getCurrentPicture();
    });
  }

  /**
    * Creates an observable to watch network connection
    */
  createOnline$() {
    return merge(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      })
    );
  }

  getCurrentPicture(): void {
    db.storedChassis.where('chassisIndex').equals(this.currentCar.chassisIndex).first().then(res => {
      this.offlineSrc = this.blobToImageSrc(res.picture);
    });
  }

  /**
    * Converts a Blob to an URL
    * Returned URL is sanitized in order to be used in an image's src
    * 
    * @param blob The Blob to convert
    * @returns SafeUrl that references the Blob
    */
  blobToImageSrc(blob) {
    let binaryData = [];
    binaryData.push(blob);
    const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob(binaryData, { type: 'application/zip' })));
    return url;
  }

}
