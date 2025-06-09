import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Socket, Server} from "socket.io";

@WebSocketGateway(3002,{})
export class CodeSyncGateway implements OnGatewayConnection{

    private code:string = "";

    handleConnection(client: any, ...args: any[]) {
        client.emit("code:sync",this.code);
    }

    @WebSocketServer() server:Server;

    @SubscribeMessage("code:sync")
    handleNewMessage(client:Socket,message:string){

        this.code = message;

        this.server.emit("code:sync",message);
    }
}