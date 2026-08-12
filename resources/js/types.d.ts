declare module 'stream-browserify';

interface Window {
    axios: any;
    Buffer: typeof Buffer;
    EventEmitter: typeof EventEmitter;
    Stream: any;
}