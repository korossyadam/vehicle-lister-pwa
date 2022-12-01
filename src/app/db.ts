// db.ts
import Dexie, { Table } from 'dexie';

export interface TodoList {
   id?: number;
   title: string;
}
export interface TodoItem {
   id?: number;
   todoListId: number;
   title: string;
   done?: boolean;
}

export interface storedBrand {
   id?: number,
   name: string,
}

export class AppDB extends Dexie {
   todoItems!: Table<TodoItem, number>;
   todoLists!: Table<TodoList, number>;
   storedBrands!: Table<storedBrand, number>;

   storedBrandsIndex: number = -1;

   constructor() {
      super('ngdexieliveQuery');
      this.version(4).stores({
         todoLists: '++id',
         todoItems: '++id, todoListId',
         storedBrands: '++id, name',
      });
      this.on('populate', () => this.populate());
   }

   getIndex(): number {
      this.storedBrandsIndex += 1;
      return this.storedBrandsIndex;
   }

   async populate() {
      const todoListId = await db.todoLists.add({
         title: 'To Do Today',
      });

      await db.storedBrands.bulkAdd([{id: this.getIndex(), name: 'ABARTH'}, {id: this.getIndex(), name: 'ACURA'}, {id: this.getIndex(), name: 'AIXAM'},
      {id: this.getIndex(), name: 'ALFA ROMEO'}, {id: this.getIndex(), name: 'ANDORIA'}, {id: this.getIndex(), name: 'ARO'}, {id: this.getIndex(), name: 'ASTON MARTIN'}, {id: this.getIndex(), name: 'AUDI'}, {id: this.getIndex(), name: 'AUSTIN'}, {id: this.getIndex(), name: 'AVIA'},
      {id: this.getIndex(), name: 'BEDFORD'}, {id: this.getIndex(), name: 'BENTLEY'}, {id: this.getIndex(), name: 'BMW'}, {id: this.getIndex(), name: 'BUICK'}, {id: this.getIndex(), name: 'CADILLAC'}, {id: this.getIndex(), name: 'CHERY'}, {id: this.getIndex(), name: 'CHEVROLET'},
      {id: this.getIndex(), name: 'CHRYSLER'}, {id: this.getIndex(), name: 'CITROEN'}, {id: this.getIndex(), name: 'DACIA'}, {id: this.getIndex(), name: 'DAEWOO'}, {id: this.getIndex(), name: 'DAF'}, {id: this.getIndex(), name: 'DAIHATSU'}, {id: this.getIndex(), name: 'DODGE'}, {id: this.getIndex(), name: 'DS'},
      {id: this.getIndex(), name: 'ELARIS'}, {id: this.getIndex(), name: 'FERRARI'}, {id: this.getIndex(), name: 'FIAT'}, {id: this.getIndex(), name: 'FORD'}, {id: this.getIndex(), name: 'FORD USA'}, {id: this.getIndex(), name: 'FSO'}, {id: this.getIndex(), name: 'GAZ'}, {id: this.getIndex(), name: 'GEO'}, {id: this.getIndex(), name: 'GMC'},
      {id: this.getIndex(), name: 'GREAT WALL'}, {id: this.getIndex(), name: 'HONDA'}, {id: this.getIndex(), name: 'HUMMER'}, {id: this.getIndex(), name: 'HYUNDAI'}, {id: this.getIndex(), name: 'INFINITI'}, {id: this.getIndex(), name: 'INNOCENTI'}, {id: this.getIndex(), name: 'ISUZU'},
      {id: this.getIndex(), name: 'IVECO'}, {id: this.getIndex(), name: 'JAGUAR'}, {id: this.getIndex(), name: 'JEEP'}, {id: this.getIndex(), name: 'KIA'}, {id: this.getIndex(), name: 'LADA'}, {id: this.getIndex(), name: 'LAMBORGHINI'}, {id: this.getIndex(), name: 'LANCIA'}, {id: this.getIndex(), name: 'LAND ROVER'},
      {id: this.getIndex(), name: 'LDV'}, {id: this.getIndex(), name: 'LEXUS'}, {id: this.getIndex(), name: 'LINCOLN'}, {id: this.getIndex(), name: 'LOTUS'}, {id: this.getIndex(), name: 'MAN'}, {id: this.getIndex(), name: 'MASERATI'}, {id: this.getIndex(), name: 'MAYBACH'}, {id: this.getIndex(), name: 'MAZDA'},
      {id: this.getIndex(), name: 'MCLAREN'}, {id: this.getIndex(), name: 'MERCEDES-BENZ'}, {id: this.getIndex(), name: 'MG'}, {id: this.getIndex(), name: 'MINI'}, {id: this.getIndex(), name: 'MITSUBISHI'}, {id: this.getIndex(), name: 'NISSAN'}, {id: this.getIndex(), name: 'OPEL'},
      {id: this.getIndex(), name: 'PEUGEOT'}, {id: this.getIndex(), name: 'PLYMOUTH'}, {id: this.getIndex(), name: 'PONTIAC'}, {id: this.getIndex(), name: 'PORSCHE'}, {id: this.getIndex(), name: 'RENAULT'}, {id: this.getIndex(), name: 'RENAULT TRUCKS'},
      {id: this.getIndex(), name: 'ROLLS-ROYCE'}, {id: this.getIndex(), name: 'ROVER'}, {id: this.getIndex(), name: 'SAAB'}, {id: this.getIndex(), name: 'SEAT'}, {id: this.getIndex(), name: 'SEVIC'}, {id: this.getIndex(), name: 'SKODA'}, {id: this.getIndex(), name: 'SMART'}, {id: this.getIndex(), name: 'SSANGYONG'},
      {id: this.getIndex(), name: 'SUBARU'}, {id: this.getIndex(), name: 'SUZUKI'}, {id: this.getIndex(), name: 'TATA'}, {id: this.getIndex(), name: 'TESLA'}, {id: this.getIndex(), name: 'TOYOTA'}, {id: this.getIndex(), name: 'TRABANT'}, {id: this.getIndex(), name: 'UAZ'}, {id: this.getIndex(), name: 'VOLVO'}, {id: this.getIndex(), name: 'VW'},
      {id: this.getIndex(), name: 'WARTBURG'}, {id: this.getIndex(), name: 'ZASTAVA'}, {id: this.getIndex(), name: 'ZAZ'}])

      await db.todoItems.bulkAdd([
         {
            todoListId,
            title: 'Feed the birds',
         },
         {
            todoListId,
            title: 'Watch a movie',
         },
         {
            todoListId,
            title: 'Have some sleep',
         },
      ]);
   }
}

export const db = new AppDB();
