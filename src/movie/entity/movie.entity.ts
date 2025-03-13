import { Exclude, Expose, Transform } from "class-transformer";

// @Exclude()
export class Movie {
  id: number;
  title: string;
  genre: string;

  // @Expose()
  // expose:string;
  
  // @Transform(
  //   ({value}) => value.toString().toUpperCase(),
  // )
  // transform:string;
}