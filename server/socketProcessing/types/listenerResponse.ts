import { Socket } from 'socket.io';

interface listenerResponse {
  socket: Socket,
  options?: { [key: string]: any },
  callback?: Function,
}

export {
  listenerResponse,
}
