import Dexie, { Table } from 'dexie';
import { Car } from './models/car.model';
import { Chassis } from './models/chassis.model';

export interface storedBrand {
   id?: number,
   name: string,
}

export class AppDB extends Dexie {
   storedBrands!: Table<storedBrand, number>;
   storedChassis!: Table<Chassis, number>;
   storedCars!: Table<Car, number>;

   storedBrandsIndex: number = -1;

   constructor() {
      super('ngdexieliveQuery');
      this.version(15).stores({
         storedBrands: '++id, name',
         storedChassis: '++id, brand, picture, chassisIndex',
         storedCars: '++id, carIndex, chassis',
      });
      this.on('populate', () => this.populate());
   }

   getIndex(): number {
      this.storedBrandsIndex += 1;
      return this.storedBrandsIndex;
   }

   async populate() {
      await db.storedBrands.clear();

      await db.storedBrands.bulkAdd([{name: 'ABARTH'}, {name: 'ACURA'}, {name: 'AIXAM'},
      {name: 'ALFA ROMEO'}, {name: 'ANDORIA'}, {name: 'ARO'}, {name: 'ASTON MARTIN'}, {name: 'AUDI'}, {name: 'AUSTIN'}, {name: 'AVIA'},
      {name: 'BEDFORD'}, {name: 'BENTLEY'}, {name: 'BMW'}, {name: 'BUICK'}, {name: 'CADILLAC'}, {name: 'CHERY'}, {name: 'CHEVROLET'},
      {name: 'CHRYSLER'}, {name: 'CITROEN'}, {name: 'DACIA'}, {name: 'DAEWOO'}, {name: 'DAF'}, {name: 'DAIHATSU'}, {name: 'DODGE'}, {name: 'DS'},
      {name: 'ELARIS'}, {name: 'FERRARI'}, {name: 'FIAT'}, {name: 'FORD'}, {name: 'FORD USA'}, {name: 'FSO'}, {name: 'GAZ'}, {name: 'GEO'}, {name: 'GMC'},
      {name: 'GREAT WALL'}, {name: 'HONDA'}, {name: 'HUMMER'}, {name: 'HYUNDAI'}, {name: 'INFINITI'}, {name: 'INNOCENTI'}, {name: 'ISUZU'},
      {name: 'IVECO'}, {name: 'JAGUAR'}, {name: 'JEEP'}, {name: 'KIA'}, {name: 'LADA'}, {name: 'LAMBORGHINI'}, {name: 'LANCIA'}, {name: 'LAND ROVER'},
      {name: 'LDV'}, {name: 'LEXUS'}, {name: 'LINCOLN'}, {name: 'LOTUS'}, {name: 'MAN'}, {name: 'MASERATI'}, {name: 'MAYBACH'}, {name: 'MAZDA'},
      {name: 'MCLAREN'}, {name: 'MERCEDES-BENZ'}, {name: 'MG'}, {name: 'MINI'}, {name: 'MITSUBISHI'}, {name: 'NISSAN'}, {name: 'OPEL'},
      {name: 'PEUGEOT'}, {name: 'PLYMOUTH'}, {name: 'PONTIAC'}, {name: 'PORSCHE'}, {name: 'RENAULT'}, {name: 'RENAULT TRUCKS'},
      {name: 'ROLLS-ROYCE'}, {name: 'ROVER'}, {name: 'SAAB'}, {name: 'SEAT'}, {name: 'SEVIC'}, {name: 'SKODA'}, {name: 'SMART'}, {name: 'SSANGYONG'},
      {name: 'SUBARU'}, {name: 'SUZUKI'}, {name: 'TATA'}, {name: 'TESLA'}, {name: 'TOYOTA'}, {name: 'TRABANT'}, {name: 'UAZ'}, {name: 'VOLVO'}, {name: 'VW'},
      {name: 'WARTBURG'}, {name: 'ZASTAVA'}, {name: 'ZAZ'}])
   }
}

export const db = new AppDB();
