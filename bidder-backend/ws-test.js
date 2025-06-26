const io = require('socket.io-client');
const util = require('util');

// Configuration
const SOCKET_URL = 'http://localhost:3000/bids';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIyIiwic3ViIjoyLCJpYXQiOjE3NTA5NjY1MjcsImV4cCI6MTc1MDk3MDEyN30.hFteTXKIKqfxlvBVROfeCkOa5fthvhneHgIbWB1N_0Y';
const ITEM_ID = 4;
const DEBUG = true;

let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

function debug(...args) {
  if (DEBUG) {
    console.log(new Date().toISOString(), ...args);
  }
}

function createSocket() {
  const socket = io(SOCKET_URL, {
    auth: { token: TOKEN },
    transports: ['websocket'], // Force WebSocket only
    reconnection: false, // We'll handle reconnection manually
    autoConnect: false // Connect manually after setup
  });

  socket.onAny((event, ...args) => {
    console.log('📡 Incoming event:', event, args);
  });

  // Event handlers
  socket.on('connect', () => {
    connectionAttempts = 0;
    debug('CONNECTED - Socket ID:', socket.id);

    socket.emit('joinItemRoom', { itemId: ITEM_ID }, (response) => {
      console.log('Join response:', response);
    });
    console.log('sent joinItemRoom')

    socket.emit('getRoomMembers', { itemId: ITEM_ID }, (members) => {
      console.log('Room members:', members);
    });
  });

  socket.on('newBid', (data) => {
    console.log('📢 NEW BID:', data);
  });

  socket.on('disconnect', (reason) => {
    debug('DISCONNECTED:', reason);
    if (reason === 'io server disconnect') {
      // Server explicitly disconnected us - don't reconnect
      console.error('❌ Server rejected connection:', reason);
      process.exit(1);
    }
    attemptReconnect(socket);
  });

  socket.on('connect_error', (err) => {
    debug('CONNECTION ERROR:', err.message);
    attemptReconnect(socket);
  });

  socket.on('error', (err) => {
    console.error('SOCKET ERROR:', err);
  });

  return socket;
}

function attemptReconnect(socket) {
  connectionAttempts++;

  if (connectionAttempts > MAX_ATTEMPTS) {
    console.error(`❌ Max reconnection attempts (${MAX_ATTEMPTS}) reached`);
    process.exit(1);
  }

  const delay = Math.min(1000 * connectionAttempts, 5000);
  debug(`⏳ Reconnecting in ${delay}ms (attempt ${connectionAttempts}/${MAX_ATTEMPTS})`);

  setTimeout(() => {
    debug('🔌 Attempting reconnect...');
    socket.connect();
  }, delay);
}

// Main execution
const socket = createSocket();
socket.connect();

// Keep process alive
process.stdin.resume();
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  socket.disconnect();
  process.exit(0);
});
