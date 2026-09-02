import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WatchPartyGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private rooms;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleCreateRoom(client: Socket, data: {
        movieId: string;
        platform: string;
    }): {
        roomId: string;
        isHost: boolean;
    };
    handleJoinRoom(client: Socket, data: {
        roomId: string;
    }): {
        error: string;
        roomId?: undefined;
        isHost?: undefined;
        movieId?: undefined;
        platform?: undefined;
        isPlaying?: undefined;
        currentTime?: undefined;
    } | {
        roomId: string;
        isHost: boolean;
        movieId: string;
        platform: string;
        isPlaying: boolean;
        currentTime: number;
        error?: undefined;
    };
    handleSyncState(client: Socket, data: {
        roomId: string;
        isPlaying: boolean;
        currentTime: number;
    }): void;
}
