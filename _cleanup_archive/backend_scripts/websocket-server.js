const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Generate unique client ID
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    clientId: clientId,
    message: 'Connected to tracking service'
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'SUBSCRIBE_TO_SHIPMENT':
          // Subscribe client to specific shipment updates
          ws.shipmentId = data.shipmentId;
          console.log(`Client ${clientId} subscribed to shipment ${data.shipmentId}`);
          break;
          
        case 'LOCATION_UPDATE':
          // Broadcast location update to all clients subscribed to this shipment
          broadcastToShipment(data.shipmentId, {
            type: 'LOCATION_UPDATE',
            shipmentId: data.shipmentId,
            data: {
              currentLocation: data.currentLocation
            }
          });
          break;
          
        case 'STATUS_UPDATE':
          // Broadcast status update
          broadcastToShipment(data.shipmentId, {
            type: 'STATUS_UPDATE',
            shipmentId: data.shipmentId,
            data: {
              status: data.status
            }
          });
          break;
          
        case 'PROGRESS_UPDATE':
          // Broadcast progress update
          broadcastToShipment(data.shipmentId, {
            type: 'PROGRESS_UPDATE',
            shipmentId: data.shipmentId,
            data: {
              progress: data.progress
            }
          });
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

// Broadcast message to all clients subscribed to a specific shipment
function broadcastToShipment(shipmentId, message) {
  clients.forEach((client, clientId) => {
    if (client.shipmentId === shipmentId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Broadcast to all connected clients
function broadcast(message) {
  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Simulate real-time updates (for testing purposes)
function simulateUpdates() {
  setInterval(() => {
    // Simulate location updates for shipment 1
    broadcastToShipment('1', {
      type: 'LOCATION_UPDATE',
      shipmentId: '1',
      data: {
        currentLocation: {
          latitude: -2.5 + (Math.random() - 0.5) * 0.1,
          longitude: 38.0 + (Math.random() - 0.5) * 0.1,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // Simulate progress updates
    const progress = Math.floor(Math.random() * 20) + 60; // 60-80%
    broadcastToShipment('1', {
      type: 'PROGRESS_UPDATE',
      shipmentId: '1',
      data: { progress }
    });
    
    // Simulate location updates for shipment 2
    broadcastToShipment('2', {
      type: 'LOCATION_UPDATE',
      shipmentId: '2',
      data: {
        currentLocation: {
          latitude: -0.5 + (Math.random() - 0.5) * 0.1,
          longitude: 36.0 + (Math.random() - 0.5) * 0.1,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    const progress2 = Math.floor(Math.random() * 20) + 30; // 30-50%
    broadcastToShipment('2', {
      type: 'PROGRESS_UPDATE',
      shipmentId: '2',
      data: { progress: progress2 }
    });
  }, 5000); // Update every 5 seconds
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  
  // Start simulation for testing
  simulateUpdates();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

module.exports = { wss, broadcast, broadcastToShipment };
