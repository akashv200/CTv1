import { io, type Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (socketInstance) return socketInstance;
  socketInstance = io(window.location.origin, {
    transports: ["websocket"],
    autoConnect: false
  });
  return socketInstance;
}
