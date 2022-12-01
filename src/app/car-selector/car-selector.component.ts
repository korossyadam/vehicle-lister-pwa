import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Chassis } from '../models/chassis.model';
import { CarSelectorService } from '../services/car-selector.service';

import { Car } from '../models/car.model';
import { MatSidenav } from '@angular/material/sidenav';
import { first } from 'rxjs/operators';
import { from, observable } from 'rxjs';

import { liveQuery } from 'dexie';
import { db, TodoList } from '../db';

@Component({
   selector: 'app-car-selector',
   templateUrl: './car-selector.component.html',
   styleUrls: ['./car-selector.component.css']
})
export class CarSelectorComponent implements OnInit {

   // To access sidenavs from TS
   @ViewChild('upperSideNav') upperSideNav: MatSidenav;
   @ViewChild('lowerSideNav') lowerSideNav: MatSidenav;

   //public brands:
   public brands;

   // Query results are stored in these arrays
   public listElements: string[] = [];
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

   constructor(private carSelectorService: CarSelectorService, private cdr: ChangeDetectorRef) { }

   // KeyBoardListener - we use this to close all sidenavs with ESCAPE
   @HostListener('document:keyup', ['$event'])
   handleKeyboardEvent(event: KeyboardEvent) {
      if (event.key == 'Escape') {
         this.closeSideNavs();
      }
   }

   ngOnInit(): void {

      //console.log(data);

      this.populate();




      /*for (let i = 0; i < observables.length; i++) {
         observables[i].pipe(first()).subscribe(data => {
            //this.cars.push(data);
            console.log(data);
         });
      }
      */



   }

   async populate() {
      this.cars = [];
      this.brands = [];
      await this.carSelectorService.queryForRandomCars().then(observables => {

         let numberOfObservables = observables.length;
         let firedObservables = 0;
         let resultCars = [];

         observables.forEach(obsvervable => {
            obsvervable.subscribe(async data => {
               resultCars.push(data[0]);
               firedObservables += 1;

               // If all observables fired
               if (firedObservables >= numberOfObservables) {
                  resultCars.forEach(resultCar => {

                     // IndexedDB Query
                     db.storedBrands.where('name').equalsIgnoreCase(resultCar.brand).first().then(res => {
                        this.brands.push(res['name']);
                     });
                  });
               }
            });
         });

      });
   }

   /**
    * Opens both lower and upper sidenavs
    */
   openSideNav() {
      this.upperSideNav.toggle();
      this.lowerSideNav.toggle();
      this.hoveredTextIndex = -1;
      this.stage = 0;
      //this.listElements = this.brands;
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

      this.listElements = [];
      let index = 0;
      //for (let i = 0; i < this.brands.length; i++) {
      // if (this.brands[i].startsWith(searchedText.toUpperCase())) {
      //  this.listElements[index] = this.brands[i];
      // index += 1;
      //}
      //}
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
      this.loading = true;

      waitForElm('.mat-drawer-inner-container').then((elm) => {
         document.querySelectorAll('.mat-drawer-inner-container')[1]!.scrollTop = 0;
         selected = selected.replace(/(\r\n|\n|\r)/gm, "");
         this.hoveredTextIndex = -1;

         // Chassis selection (stage 0 -> stage 1)
         if (this.stage == 0) {
            this.stage += 1;

            let localStorageQuery = localStorage.getItem(selected);
            if (localStorageQuery !== null) {
               let localStorageQueryParts = localStorageQuery.split('*');
               let data = [];
               for (let i = 0; i < localStorageQueryParts.length; i++) {
                  let object = JSON.parse(localStorageQueryParts[i]);
                  data.push(object);
               }

               this.chassis = data;
               this.chassisActive = this.chassis;

               // Preload all chassis images
               let urls = [];
               for (let i = 0; i < this.chassis.length; i++) {
                  if (this.chassis[i].hasImg) {
                     urls.push('https://storage.googleapis.com/west-webshop.appspot.com/' + this.chassis[i].chassisIndex + '.png');
                  }
               }
               this.preloadImages(urls);

               // Fill listElement with chassis names
               this.listElements = [];
               for (let objec of this.chassis) {
                  this.listElements.push(objec.name);
               }

               this.lastSelectedBrand = selected;
               this.loading = false;

            } else {
               this.carSelectorService.selectBrand(selected).pipe(first()).subscribe(data => {
                  this.chassis = data;
                  this.chassisActive = this.chassis;

                  // Fill listElement with chassis names
                  this.listElements = [];
                  for (let objec of this.chassis) {
                     this.listElements.push(objec.name);
                  }

                  this.lastSelectedBrand = selected;
                  this.loading = false;

                  // Add query result to localStorage to optimize future queries
                  let localStorageLine = '';
                  for (let i = 0; i < data.length; i++) {
                     localStorageLine += '{"chassisIndex": ' + data[i].chassisIndex + ',"name": "' + data[i].name + '","year": "' + data[i].year + '","hasImg": ' + data[i].hasImg + '}*';
                  }

                  // Remove last '*' seperator character from string
                  localStorageLine = localStorageLine.slice(0, -1);
                  localStorage.setItem(selected, localStorageLine);
               });
            }

            // Engine selection (stage 1 -> stage 2)
         } else if (this.stage == 1) {
            this.stage += 1;
            this.carSelectorService.selectChassis(selected).pipe(first()).subscribe(data => {
               this.cars = data;
               this.carsActive = this.cars;

               // Fill listelements with engine names
               this.listElements = [];
               for (let objec of this.cars) {
                  this.listElements.push(objec.engine);
               }

               this.lastSelectedChassis = selected;
               this.loading = false;
            });
         }

      });

   }

   /**
    * This function gets called when user clicks the back button
    */
   back(): void {
      if (this.stage == 1) {
         //this.listElements = this.brands;
         this.stage = 0;
      } else {
         this.stage = 0;
         this.selectElements(this.lastSelectedBrand);
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
