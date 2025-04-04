import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  timestamps: true
})
export class MovieDetail extends Document {
  @Prop({
    required: true,
  })
  detail: string;

  // @Prop({
  //   type: Types.ObjectId,
  //   ref: 'Movie',
  //   required: true,
  //   unique: true,
  // })
  // movie: Movie;
}

export const MovieDetailSchema = SchemaFactory.createForClass(MovieDetail);
