# WebSocket Connection Error - Explanation & Fix

## 🔍 Understanding the Error

You're seeing these errors because:

1. **WebSocket Server Not Running**: The frontend is trying to connect to `ws://localhost:3001/tracking`, but the WebSocket server is not running.

2. **Wrong URL Path**: The standalone `websocket-server.js` doesn't use the `/tracking` path - it listens on the root path.

3. **Two Different WebSocket Systems**:
   - **Standalone Server** (`websocket-server.js`): Native WebSocket on port 3001
   - **NestJS Gateway**: Socket.IO on port 3000 (namespace `/tracking`)

## ✅ Solutions

### Option 1: Start the Standalone WebSocket Server (Recommended for Development)

```bash
cd backend
node websocket-server.js
```

This will start the WebSocket server on port 3001.

**Note**: The URL should be `ws://localhost:3001` (without `/tracking` path)

### Option 2: Use NestJS Socket.IO (Already Running)

The NestJS app already has WebSocket support via Socket.IO on port 3000. Other components (like `TripTracker`) use this.

**URL**: `http://localhost:3000/tracking` (Socket.IO, not native WebSocket)

### Option 3: Disable WebSocket (App Works Without It)

The WebSocket connection is now **optional**. The app will work fine without it - you just won't get real-time updates.

To disable WebSocket, add to your `.env`:
```env
VITE_ENABLE_WEBSOCKET=false
```

## 🔧 What Was Fixed

1. ✅ **Graceful Error Handling**: WebSocket failures no longer break the app
2. ✅ **Silent Failures**: Connection errors are handled silently (no console spam)
3. ✅ **Reduced Reconnection Attempts**: From 5 to 3 attempts
4. ✅ **Connection Timeout**: 5-second timeout to prevent hanging
5. ✅ **URL Fix**: Removed `/tracking` path for standalone server
6. ✅ **Optional Connection**: App works without WebSocket

## 📋 Current WebSocket Configuration

### Frontend (`websocket.ts`)
- **Default URL**: `ws://localhost:3001` (standalone server)
- **Environment Variable**: `VITE_WEBSOCKET_URL`
- **Enable/Disable**: `VITE_ENABLE_WEBSOCKET` (default: true)

### Backend Options

#### 1. Standalone Server (`websocket-server.js`)
```bash
# Start standalone WebSocket server
cd backend
node websocket-server.js
# Runs on port 3001
```

#### 2. NestJS Socket.IO Gateway
- Already running with the main app (port 3000)
- Namespace: `/tracking`
- Used by: `TripTracker`, `PricingCalculatorWidget`
- Protocol: Socket.IO (not native WebSocket)

## 🚀 Quick Fix Commands

### Start WebSocket Server
```bash
# Terminal 1: Start main backend
cd backend
npm run start:dev

# Terminal 2: Start WebSocket server (optional)
cd backend
node websocket-server.js
```

### Or Disable WebSocket
```bash
# Add to frontend/.env
echo "VITE_ENABLE_WEBSOCKET=false" >> frontend/.env
```

## 📝 Environment Variables

### Frontend `.env`
```env
# WebSocket URL (optional)
VITE_WEBSOCKET_URL=ws://localhost:3001

# Enable/disable WebSocket (default: true)
VITE_ENABLE_WEBSOCKET=true
```

### Backend `.env`
```env
# WebSocket server port (for standalone server)
PORT=3001
```

## ✅ Verification

After fixing, you should see:
- ✅ No WebSocket errors in console
- ✅ App loads normally
- ✅ Real-time updates work (if WebSocket is running)
- ✅ App works without WebSocket (graceful degradation)

## 🎯 Recommendation

**For Development**: 
- Start the standalone WebSocket server if you need real-time tracking
- Or disable it if you don't need real-time updates yet

**For Production**:
- Use NestJS Socket.IO gateway (already integrated)
- Or set up a proper WebSocket server
- Configure `VITE_WEBSOCKET_URL` to point to production server

---

**Status**: ✅ Fixed - WebSocket is now optional and won't break the app

