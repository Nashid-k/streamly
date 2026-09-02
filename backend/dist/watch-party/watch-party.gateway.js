"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchPartyGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let WatchPartyGateway = class WatchPartyGateway {
    constructor() {
        this.rooms = new Map();
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.rooms.forEach((room, roomId) => {
            if (room.users.has(client.id)) {
                room.users.delete(client.id);
                this.server.to(roomId).emit('userLeft', { userId: client.id, activeUsers: room.users.size });
                if (room.users.size === 0) {
                    this.rooms.delete(roomId);
                }
                else if (room.hostId === client.id) {
                    const newHost = Array.from(room.users)[0];
                    room.hostId = newHost;
                    this.server.to(roomId).emit('newHost', { hostId: newHost });
                }
            }
        });
    }
    handleCreateRoom(client, data) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.rooms.set(roomId, {
            hostId: client.id,
            users: new Set([client.id]),
            movieId: data.movieId,
            platform: data.platform,
            isPlaying: false,
            currentTime: 0,
        });
        client.join(roomId);
        return { roomId, isHost: true };
    }
    handleJoinRoom(client, data) {
        const room = this.rooms.get(data.roomId);
        if (!room) {
            return { error: 'Room not found' };
        }
        room.users.add(client.id);
        client.join(data.roomId);
        client.to(data.roomId).emit('userJoined', { userId: client.id, activeUsers: room.users.size });
        return {
            roomId: data.roomId,
            isHost: false,
            movieId: room.movieId,
            platform: room.platform,
            isPlaying: room.isPlaying,
            currentTime: room.currentTime
        };
    }
    handleSyncState(client, data) {
        const room = this.rooms.get(data.roomId);
        if (room && room.hostId === client.id) {
            room.isPlaying = data.isPlaying;
            room.currentTime = data.currentTime;
            client.to(data.roomId).emit('syncState', {
                isPlaying: room.isPlaying,
                currentTime: room.currentTime
            });
        }
    }
};
exports.WatchPartyGateway = WatchPartyGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WatchPartyGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WatchPartyGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WatchPartyGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('syncState'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WatchPartyGateway.prototype, "handleSyncState", null);
exports.WatchPartyGateway = WatchPartyGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], WatchPartyGateway);
//# sourceMappingURL=watch-party.gateway.js.map