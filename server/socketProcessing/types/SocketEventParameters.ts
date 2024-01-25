import { Socket } from 'socket.io';

interface SocketEventParameters {
  socket: Socket,
  options?: { [key: string]: any },
  callback?: Function,
}

export {
  SocketEventParameters,
}
