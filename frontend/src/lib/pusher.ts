import Pusher from "pusher-js";

// Pusher singleton – reuse across the app
let _pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!_pusherInstance) {
    _pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY as string, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER as string,
    });
  }
  return _pusherInstance;
}

export function disconnectPusher() {
  if (_pusherInstance) {
    _pusherInstance.disconnect();
    _pusherInstance = null;
  }
}
