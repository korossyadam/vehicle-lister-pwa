export class Car {

   public carIndex: string;
   public chassisIndex: number;
   public brand: string;
   public chassis: string;
   public engine: string;
   public engineCode: string;
   public kw: string;
   public hp: string;
   public displacement: string;
   public year: string;
   public fuel: string;
   public productLengths: string[];

   constructor(carIndex: string, chassisIndex: number, brand: string, chassis: string, engine: string, engineCode: string, kw: string, hp: string, displacement: string, year: string, fuel: string) {
      this.carIndex = carIndex;
      this.chassisIndex = chassisIndex;
      this.brand = brand;
      this.chassis = chassis;
      this.engine = engine;
      this.engineCode = engineCode;
      this.kw = kw;
      this.hp = hp;
      this.displacement = displacement;
      this.year = year;
      this.fuel = fuel;

   }

}