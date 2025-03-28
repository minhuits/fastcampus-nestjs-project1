import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";
import { User } from "src/user/schema/user.schema";
import { ChatRoom } from "./chat-room.schema";

@Schema({
  timestamps: true
})
export class Chat extends Document {
  @Prop({
    type: {
      type: Types.ObjectId,
      ref: 'User',
    },
    required: true,
  })
  author: User;

  @Prop({
    required: true,
  })
  message: string;

  @Prop({
    type: {
      type: Types.ObjectId,
      ref: 'ChatRoom',
    },
    required: true,
  })
  chatRoom: ChatRoom;
}
export const ChatSchema = SchemaFactory.createForClass(Chat);
