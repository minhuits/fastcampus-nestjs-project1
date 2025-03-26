import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) { }

  handleDisconnect(client: Socket) {
    return;
  }

  async handleConnection(client: Socket) {
    try {
      const rawToken = client.handshake.auth.authorization;

      const payload = await this.authService.parseBearerToken(rawToken, false);

      if (payload) {
        client.data.user = payload;
      } else {
        client.disconnect();
      }
    } catch (e) {
      console.log(e);
      client.disconnect();
    }
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
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
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