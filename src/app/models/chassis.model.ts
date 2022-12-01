import * as internal from "stream";

export class Chassis {

   public chassisIndex: number;
   public brand: string;
   public name: string;
   public year: string;
   public hasImg: boolean;

   constructor(chassisIndex: number, brand: string, name: string, year: string, hasImg: boolean) {
      this.chassisIndex = chassisIndex;
      this.brand = brand;
      this.name = name;
      this.year = year;
      this.hasImg = hasImg;

   }

}