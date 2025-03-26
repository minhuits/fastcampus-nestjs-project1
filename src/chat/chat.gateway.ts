import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
// import { AuthService } from 'src/auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    // private readonly authService: AuthService,
  ) { }

  handleDisconnect(client: Socket) {
    return;
  }

  @SubscribeMessage('receiveMessage')
  async receiveMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('receiveMessage');
    console.log(data);
    console.log(client);
  }
  
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: {message: string},
    @ConnectedSocket() client: Socket,
  ){
    client.emit('sendMessage', {
      ...data,
      from: 'server',
    });
    client.emit('sendMessage', {
      ...data,
      from: 'server',
    });
    client.emit('sendMessage', {
      ...data,
      from: 'server',
    });
  }
}