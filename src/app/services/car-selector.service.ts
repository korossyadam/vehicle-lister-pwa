import { Injectable } from '@angular/core';

import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map, firstValueFrom, first } from 'rxjs';
import { Chassis } from '../models/chassis.model';
import { Car } from '../models/car.model';

@Injectable({
   providedIn: 'root'
})
export class CarSelectorService {

   constructor(private afs: AngularFirestore, private db: AngularFireDatabase) { }

   async queryForRandomCars() {
      const numberOfCars = 1;
      let cars: any[] = [];
      for (let i = 0; i < numberOfCars; i++) {
         await cars.push(this.afs.collection("cars", ref => ref.where("carIndex", ">=", this.generateRandomNumbers(1, 20000)).orderBy("carIndex", "asc").limit(1)).valueChanges());
      }

      return cars;
   }

   // Get Chassis by Brand
   getChassis(chassisIndexes: string[]): Observable<Chassis[]> {
      return this.afs.collection("chassis", ref => ref.where("chassisIndex", 'in', chassisIndexes).orderBy("name", "asc")).valueChanges() as Observable<Chassis[]>;
   }

   generateRandomNumbers(min: number, max: number): number {
      return (Math.floor(Math.random() * (max - min + 1) + min));
   }

}
