import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';
import { Socket } from 'socket.io';
import { Role, User } from 'src/user/entity/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatRoom } from './entity/chat-room.entity';
import { Chat } from './entity/chat.entity';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }


  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRoom = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();

    chatRoom.forEach((room) => {
      client.join(room.id.toString());
      // client.join(`chatRoom/${room.id.toString()}`);
    })
  }

  async createMessage(payload: { sub: number }, { message, room }: CreateChatDto, queryRunner: QueryRunner) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const chatRoom = await this.getOrCreateChatRoom(user, queryRunner, room);

    if (!chatRoom) {
      throw new BadRequestException('Chat Room not found');
    }

    const msgModel = await queryRunner.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    })

    const client = this.connectedClients.get(user.id);

    client?.to(chatRoom.id.toString()).emit('newMessage', plainToClass(Chat, msgModel));

    return message;
  }

  async getOrCreateChatRoom(user: User, queryRunner: QueryRunner, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room 값을 필수로 제공해야합니다!');
      }

      return queryRunner.manager.findOne(ChatRoom, {
        where: { id: room },
        relations: ['users'],
      })
    }

    let chatRoom = await queryRunner.manager.createQueryBuilder(ChatRoom, 'chatRoom')
      .innerJoin('chatRoom.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await queryRunner.manager.findOne(User, { where: { role: Role.admin } }) as User;

      chatRoom = await this.chatRoomRepository.save({
        users: [user, adminUser],
      });

      [user.id, adminUser.id].forEach((userId) => {
        const client = this.connectedClients.get(userId);

        if (client && chatRoom) {
          client.emit('roomCreated', chatRoom.id);
          client.join(chatRoom.id.toString());
          // client.join(`chat/${chatRoom.id.toString()}`);
        }
      });
    }

    return chatRoom;
  }
}
