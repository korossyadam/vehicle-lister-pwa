import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Chassis } from '../models/chassis.model';
import { CarSelectorService } from '../services/car-selector.service';
import { Car } from '../models/car.model';
import { MatSidenav } from '@angular/material/sidenav';
import { Observable, Observer, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { SwUpdate } from '@angular/service-worker';
import { liveQuery } from 'dexie';
import { db } from '../db';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
   selector: 'app-car-selector',
   templateUrl: './car-selector.component.html',
   styleUrls: ['./car-selector.component.css']
})
export class CarSelectorComponent implements OnInit {

   // To access sidenavs from TS
   @ViewChild('upperSideNav') upperSideNav: MatSidenav;
   @ViewChild('lowerSideNav') lowerSideNav: MatSidenav;

   // Query results are stored in these arrays
   public listElements: string[] = [];
   public brands: string[];
   public activeBrands: string[];
   public chassis: Chassis[];
   public chassisActive: Chassis[];
   public cars: Car[];
   public carsActive: Car[];

   // Stage represents the stage of vehicle search, (ex. 1 means brand is already selected, chassis is not)
   public stage: number = 0;

   // Decorative rows in list
   public lastSelectedBrand: string;
   public lastSelectedChassis: string;
   public lastDecor = '';

   // Image of selected chassis
   public imgCardStyle = { 'position': 'absolute', 'top': '50px', 'left': '500px', 'width': '150px', 'height': '200px', 'z-index': '9999999' };
   public imgCardHeight = 0;
   public hoveredTextIndex = -1;
   public needToShowErrorIcon = false;

   public loading = false;

   // PWA variables
   public update: boolean = false;
   public isOnline: boolean;

   constructor(updates: SwUpdate, private carSelectorService: CarSelectorService, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {
      updates.available.subscribe(res => {
         updates.activateUpdate().then(() => document.location.reload());
      });
   }

   // KeyBoardListener - we use this to close all sidenavs with ESCAPE
   @HostListener('document:keyup', ['$event'])
   handleKeyboardEvent(event: KeyboardEvent) {
      if (event.key == 'Escape') {
         this.closeSideNavs();
      }
   }

   /* On init configure indexedDB */
   ngOnInit(): void {

      // First populate db with all avaible brands
      db.populate().then(res => {

         // Change isOnline variable on network status change
         this.createOnline$().subscribe(isOnline => this.isOnline = isOnline);

         // If online, query for additional cars from API
         if (this.isOnline) {
            this.populateFromAPI();
            // If offline, do not query
         } else {
            this.getAllActiveBrands();
         }
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

   /**
    * This function only runs on init when there is internet connection avaible
    * First queries a randomly selected N amount of Cars from Firebase API
    * Depending on the first queries return value, queries for parent Chassis
    * Caches all objects to indexedDB to be used offline later
    */
   async populateFromAPI(): Promise<void> {
      this.chassis = [];
      this.brands = [];

      // Query for random Cars
      await this.carSelectorService.queryForRandomCars().then(observables => {
         let numberOfObservables = observables.length;
         let firedObservables = 0;
         let resultCars = [];

         // Loop through all returned observables
         observables.forEach(obsvervable => {
            obsvervable.subscribe(async data => {
               resultCars.push(data[0]);
               firedObservables += 1;

               // If all observables fired
               if (firedObservables >= numberOfObservables) {
                  let chassisIndexes = [];

                  // Upload each Car to indexedDB
                  resultCars.forEach(resultCar => {
                     chassisIndexes.push(resultCar.chassisIndex);
                     db.storedCars.put(resultCar);
                  });

                  // Query for multiple Chassis based on previous Car's chassisIndexes
                  this.carSelectorService.getChassis(chassisIndexes).subscribe(data => {
                     data.forEach(async element => {

                        // Fetch and create a Blob from Firebase API images
                        const res = await fetch('https://storage.googleapis.com/west-webshop.appspot.com/' + element.chassisIndex + '.png');
                        const blob = await res.blob();
                        element.picture = blob;

                        // Store Chassis to indexedDB with appended Blob image
                        db.storedChassis.put(element);
                     });

                     // Offline methods
                     this.getAllActiveBrands();
                  });
               }
            });
         });

      });
   }

   /**
    * For every Car in indexedDB query for its corresponding brand
    */
   getAllActiveBrands(): void {

      // Query for stored cars from indexed DB
      db.storedCars.toArray().then(res => {
         this.cars = res;

         // Fill up an array of brands that we need to query for
         let queriedBrands: string[] = [];
         this.cars.forEach(car => {
            if (!queriedBrands.includes(car.brand)) {
               queriedBrands.push(car.brand);
            }
         });

         // Query for all brands that needs to be displayed
         db.storedBrands.where('name').anyOf(queriedBrands).toArray().then(res => {

            // Map {id, name} object to string[]
            this.brands = res.map(obj => {
               return obj['name'];
            });

            this.activeBrands = this.brands;
         });

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

   /**
    * Opens both lower and upper sidenavs
    */
   openSideNav() {
      this.upperSideNav.toggle();
      this.lowerSideNav.toggle();
      this.hoveredTextIndex = -1;
      this.stage = 0;
   }

   /**
    * Closes both lower and upper sidenavs
    */
   closeSideNavs() {
      this.upperSideNav.close();
      this.lowerSideNav.close();
      this.hoveredTextIndex = -1;
   }

   /**
    * This method is called every time a character is typed into the brand search bar
    * Performs a client side data filtering, only leaves in car brands that start with the searched text
    * @param inputEvent 
    */
   reAddBrands(inputEvent: any): void {
      let searchedText = (inputEvent.target as HTMLInputElement).value;

      this.activeBrands = [];
      for (let i = 0; i < this.brands.length; i++) {
         if (this.brands[i].startsWith(searchedText.toUpperCase())) {
            this.activeBrands.push(this.brands[i]);
         }
      }
   }

   /**
    * This method is called every time a character is typed into the chassis search bar
    * Filters out chassis depending on function parameters
    * 
    * @param type User input, any text, the model of car (ex. E46)
    * @param year User input, only number, the year of the car (ex. 2003)
    */
   reAddChassis(type: string, year: string): void {
      if ((parseInt(year) < 1000 || parseInt(year) > 10000) && year != '')
         return;

      this.chassisActive = [];
      this.hoveredTextIndex = -1;
      let counter = 0;

      // Check for every chassis whether they should be displayed in the list
      for (let i = 0; i < this.chassis.length; i++) {
         let c: Chassis = this.chassis[i];

         // Remove all whitespaces to make search more accurate
         let name = c.name.replace(/\s/g, '');
         type = type.replace(/\s/g, '');

         // Name check
         if (!name.toUpperCase().startsWith(type.toUpperCase()))
            continue;

         // The year the chassis started being produced
         let yearRange = c.year;
         let yearStart = parseInt(yearRange.split('/')[0]);

         // This means the chassis is still being produced as of today
         if (yearRange.split('-').length == 3) {
            if (yearStart <= parseInt(year) || year == '') {
               this.chassisActive[counter] = c;
               counter += 1;
            }
         } else {
            let yearEnd = parseInt(yearRange.split('/')[1].split(' ')[2]);
            if ((yearStart <= parseInt(year) && yearEnd >= parseInt(year)) || year == '') {
               this.chassisActive[counter] = this.chassis[i];
               counter += 1;
            }
         }
      }

      // Force change detection to avoid ERROR NG0100
      this.cdr.detectChanges();
   }

   /**
    * This method is called every time a character is typed into the engine code search bar
    * Filters out cars depending on function parameters
    * 
    * @param engine User input, any text, the model of car (ex. E46)
    * @param year User input, only number, the year of the car (ex. 2003)
    * @param kw User input, only number, the model of car (ex. 132)
    * @param hp User input, only number, the model of car (ex. 180)
    * @param fuel User input, pre-selected values, the fuel of car (ex. Gas)
    */
   reAddCars(engine: string, year: string, kw: string, hp: string, fuel: string): void {
      if ((parseInt(year) < 1000 || parseInt(year) > 10000) && year != '')
         return;

      this.carsActive = [];
      this.hoveredTextIndex = -1;
      let counter = 0;

      // Check for every car whether they should be displayed in the list
      for (let i = 0; i < this.cars.length; i++) {
         let c: Car = this.cars[i];

         // Remove all whitespaces to make search more accurate
         engine = engine.replace(/\s/g, '');

         // Engine Code check
         let engineCodes = c.engineCode.split(",");
         let exists = false;
         for (let j = 0; j < engineCodes.length; j++) {
            engineCodes[j] = engineCodes[j].replace(/\s/g, '');
            if (engineCodes[j].toUpperCase().startsWith(engine.toUpperCase()))
               exists = true;
         }

         // If none of the engine codes are present, skip this car
         if (!exists)
            continue;

         // Performance check: KW - allow +-5 error
         let carKw = c.kw;
         if (kw != '' && (parseInt(carKw) - 5 > parseInt(kw) || parseInt(carKw) + 5 < parseInt(kw)))
            continue;

         // Performance check: HP - allow +-7 error
         let carHp = c.hp;
         if (hp != '' && (parseInt(carHp) - 7 > parseInt(hp) || parseInt(carHp) + 7 < parseInt(hp)))
            continue;

         // Remove all cars with not appropriate fuel type, except when 'all' is selected
         if (fuel != 'all' && c.fuel != fuel)
            continue;

         // The year the car started being produced
         let yearRange = c.year;
         let yearStart = parseInt(yearRange.split('/')[0]);

         // This means the car is still being produced as of today
         if (yearRange.split('-').length == 3) {
            if (yearStart <= parseInt(year) || year == '') {
               this.carsActive[counter] = c;
               counter += 1;
            }
         } else {
            let yearEnd = parseInt(yearRange.split('/')[1].split(' ')[2]);
            if ((yearStart <= parseInt(year) && yearEnd >= parseInt(year)) || year == '') {
               this.carsActive[counter] = this.cars[i];
               counter += 1;
            }
         }
      }

      // Force change detection to avoid ERROR NG0100
      this.cdr.detectChanges();
   }

   // This method calls carSelectorService to check for cars in searched brand
   selectElements(selected: string): void {
      this.cdr.detectChanges();
      this.loading = true;

      waitForElm('.mat-drawer-inner-container').then((elm) => {
         document.querySelectorAll('.mat-drawer-inner-container')[1]!.scrollTop = 0;
         selected = selected.replace(/(\r\n|\n|\r)/gm, "");
         this.hoveredTextIndex = -1;

         // Chassis selection (stage 0 -> stage 1)
         if (this.stage == 0) {
            this.stage += 1;
            this.loading = false;

            this.chassisActive = [];
            db.storedChassis.where('brand').equalsIgnoreCase(selected).toArray().then(res => {
               this.chassis = res;
               this.chassisActive = res;
            });

            // Engine selection (stage 1 -> stage 2)
         } else if (this.stage == 1) {
            this.stage += 1;
            this.loading = false;
            this.lastSelectedBrand = selected;

            this.carsActive = [];
            db.storedCars.where('chassis').equalsIgnoreCase(selected).toArray().then(res => {
               this.cars = res;
               this.carsActive = res;
            });
         }

      });

   }

   /**
    * This function gets called when user clicks the back button
    */
   back(): void {
      if (this.stage == 1) {
         this.stage = 0;
      } else {
         this.stage = 1;
      }

      this.cdr.detectChanges();
   }

   /**
    * This function checks whether only one element is inside the displayed list
    * 
    * @param element The current listElement to determine decoration text
    * @returns Whether there is only one element in the list
    */
   onlyDecor(element: string): boolean {
      if (this.stage == 0 && this.listElements.length == 1) {
         this.lastDecor = element.charAt(0);
         return true;
      } else if (this.stage == 1 && this.chassisActive.length == 1) {
         this.lastDecor = element.split(' ')[0];
         return true;
      } else if (this.stage == 2 && this.carsActive.length == 1) {
         this.lastDecor = element.split(' ')[0];
         return true;
      }

      return false;
   }

   /** 
    * Check if we need to change grey line decoration inbetween listElements
    * If new decoration text is different from the old one, a new decoration line is needed
    * 
    * @param element The current listElement to determine decoration text
    * @returns The element's decoration text
    */
   getNewDecor(element: string): string {
      if (this.stage == 0) {
         this.lastDecor = element.charAt(0);
      } else {
         this.lastDecor = element.split(' ')[0];
      }

      return this.lastDecor;
   }

   /**
    * Change the Y position of the displayed image when hovering above a selectable car
    * 
    * @param index The index of listElement that the user is hovering over
    */
   setHoveredIndex(index: number): void {
      this.hoveredTextIndex = index;
      this.needToShowErrorIcon = false;

      const element = document.getElementById(this.hoveredTextIndex + '');
      let offset = element!.getBoundingClientRect();
      let imgCardHeight = offset.top;

      this.imgCardStyle = { 'position': 'absolute', 'left': '560px', 'top': + Math.min(imgCardHeight - 73, 757) + 'px', 'width': '220px', 'height': '145px', 'z-index': '9999999' };
   }

   /**
    * Preloads images to avoid visible buffering
    * 
    * @param urls An array of image URL's to preload
    */
   preloadImages(urls: string[]) {
      for (let i = 0; i < urls.length; i++) {
         let img = new Image();
         img.src = urls[i];
      }
   }

}

/**
 * Waits for an element to be present
 * 
 * @param selector The querySelector of the element
 * @returns Promise 
 */
function waitForElm(selector: string) {
   return new Promise(resolve => {
      if (document.querySelector(selector)) {
         return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
         if (document.querySelector(selector)) {
            resolve(document.querySelector(selector));
            observer.disconnect();
         }
      });

      observer.observe(document.body, {
         childList: true,
         subtree: true
      });
   });
}
