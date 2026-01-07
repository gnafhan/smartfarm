import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const subscribeToRoom = (room: string): void => {
  const s = getSocket();
  s.emit('subscribe:barn', { barnId: room });
};

export const unsubscribeFromRoom = (room: string): void => {
  const s = getSocket();
  s.emit('unsubscribe:barn', { barnId: room });
};

export default socket;
