const { io } = require('socket.io-client');

console.log('Testing WebSocket connection...');

// Test connection to events namespace
const eventsSocket = io('http://localhost:3001/events', {
  transports: ['websocket', 'polling'],
});

eventsSocket.on('connect', () => {
  console.log('✅ Successfully connected to /events namespace');
  console.log('Socket ID:', eventsSocket.id);
});

eventsSocket.on('disconnect', () => {
  console.log('❌ Disconnected from /events namespace');
});

eventsSocket.on('connect_error', (error) => {
  console.log('❌ Connection error to /events namespace:', error.message);
});

// Test connection to tracking namespace
const trackingSocket = io('http://localhost:3001/tracking', {
  transports: ['websocket', 'polling'],
});

trackingSocket.on('connect', () => {
  console.log('✅ Successfully connected to /tracking namespace');
  console.log('Socket ID:', trackingSocket.id);
});

trackingSocket.on('disconnect', () => {
  console.log('❌ Disconnected from /tracking namespace');
});

trackingSocket.on('connect_error', (error) => {
  console.log('❌ Connection error to /tracking namespace:', error.message);
});

// Keep the test running for 10 seconds
setTimeout(() => {
  console.log('\nTest completed. Closing connections...');
  eventsSocket.close();
  trackingSocket.close();
  process.exit(0);
}, 10000);