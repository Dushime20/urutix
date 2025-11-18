/**
 * WebSocket API Documentation for Real-Time Tracking System
 *
 * This file contains comprehensive documentation for the Socket.io WebSocket API
 * used for real-time trip tracking, location updates, and alert management.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketConnection:
 *       type: object
 *       description: WebSocket connection configuration
 *       properties:
 *         url:
 *           type: string
 *           example: 'ws://localhost:3000/tracking'
 *           description: WebSocket server URL
 *         auth:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT authentication token
 *               example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *         options:
 *           type: object
 *           properties:
 *             transports:
 *               type: array
 *               items:
 *                 type: string
 *               example: ['websocket', 'polling']
 *             timeout:
 *               type: number
 *               example: 20000
 *               description: Connection timeout in milliseconds
 *
 *     LocationUpdate:
 *       type: object
 *       description: Real-time GPS location update
 *       required:
 *         - tripId
 *         - latitude
 *         - longitude
 *         - timestamp
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Unique identifier of the trip
 *         latitude:
 *           type: number
 *           format: double
 *           example: 40.7128
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           format: double
 *           example: -74.0060
 *           description: Longitude coordinate
 *         speed:
 *           type: number
 *           format: double
 *           example: 65
 *           description: Vehicle speed in km/h
 *         heading:
 *           type: number
 *           format: double
 *           example: 180
 *           description: Vehicle heading in degrees (0-360)
 *         accuracy:
 *           type: number
 *           format: double
 *           example: 5
 *           description: GPS accuracy in meters
 *         batteryLevel:
 *           type: number
 *           format: double
 *           example: 85
 *           description: Device battery level percentage
 *         isMoving:
 *           type: boolean
 *           example: true
 *           description: Whether the vehicle is currently moving
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Timestamp of the location update
 *         metadata:
 *           type: object
 *           description: Additional tracking metadata
 *           example:
 *             engineTemp: 85
 *             fuelLevel: 75
 *             weather: 'sunny'
 *             roadConditions: 'dry'
 *
 *     TripStatusUpdate:
 *       type: object
 *       description: Trip status update
 *       required:
 *         - tripId
 *         - status
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Unique identifier of the trip
 *         status:
 *           type: string
 *           enum: [STARTED, PICKUP_ARRIVED, PICKUP_COMPLETED, DELIVERY_ARRIVED, DELIVERY_COMPLETED, COMPLETED, CANCELLED]
 *           example: 'PICKUP_ARRIVED'
 *           description: New trip status
 *         eta:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T14:30:00Z'
 *           description: Estimated time of arrival
 *         distance:
 *           type: number
 *           format: double
 *           example: 150.5
 *           description: Distance to destination in kilometers
 *         duration:
 *           type: number
 *           format: integer
 *           example: 120
 *           description: Estimated duration in minutes
 *         metadata:
 *           type: object
 *           description: Additional status metadata
 *           example:
 *             customerContacted: true
 *             weatherConditions: 'rainy'
 *             trafficConditions: 'moderate'
 *
 *     EmergencyAlert:
 *       type: object
 *       description: Emergency alert data
 *       required:
 *         - tripId
 *         - type
 *         - message
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Unique identifier of the trip
 *         type:
 *           type: string
 *           enum: [ACCIDENT, BREAKDOWN, MEDICAL, SECURITY, WEATHER, OTHER]
 *           example: 'ACCIDENT'
 *           description: Type of emergency
 *         message:
 *           type: string
 *           example: 'Vehicle involved in minor collision, driver needs assistance'
 *           description: Emergency message description
 *         location:
 *           type: object
 *           description: Location coordinates where emergency occurred
 *           properties:
 *             lat:
 *               type: number
 *               format: double
 *               example: 40.7128
 *             lng:
 *               type: number
 *               format: double
 *               example: -74.0060
 *         details:
 *           type: object
 *           description: Additional emergency details
 *           example:
 *             severity: 'HIGH'
 *             requiresImmediateResponse: true
 *             contactNumber: '+1234567890'
 *
 *     AlertAcknowledgment:
 *       type: object
 *       description: Alert acknowledgment data
 *       required:
 *         - alertId
 *       properties:
 *         alertId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440004'
 *           description: Unique identifier of the alert to acknowledge
 *
 *     TripJoin:
 *       type: object
 *       description: Join trip room data
 *       required:
 *         - tripId
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Unique identifier of the trip to join
 *
 *     TripLeave:
 *       type: object
 *       description: Leave trip room data
 *       required:
 *         - tripId
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Unique identifier of the trip to leave
 *
 *     ConnectionConfirmed:
 *       type: object
 *       description: Connection confirmation response
 *       properties:
 *         socketId:
 *           type: string
 *           example: 'socket-123456'
 *           description: Unique socket identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440005'
 *           description: User identifier
 *         tenantId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440006'
 *           description: Tenant identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Connection timestamp
 *
 *     LocationUpdated:
 *       type: object
 *       description: Location update broadcast
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Trip identifier
 *         location:
 *           type: object
 *           description: Updated location data
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *               example: 40.7128
 *             longitude:
 *               type: number
 *               format: double
 *               example: -74.0060
 *             speed:
 *               type: number
 *               format: double
 *               example: 65
 *             heading:
 *               type: number
 *               format: double
 *               example: 180
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: '2024-01-15T10:30:00Z'
 *         eta:
 *           type: object
 *           description: Updated ETA information
 *           properties:
 *             eta:
 *               type: string
 *               format: date-time
 *               example: '2024-01-15T14:30:00Z'
 *             distance:
 *               type: number
 *               format: double
 *               example: 150.5
 *         alerts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DriverAlert'
 *           description: New alerts generated from this location update
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Broadcast timestamp
 *
 *     TripStatusUpdated:
 *       type: object
 *       description: Trip status update broadcast
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Trip identifier
 *         status:
 *           type: string
 *           enum: [STARTED, PICKUP_ARRIVED, PICKUP_COMPLETED, DELIVERY_ARRIVED, DELIVERY_COMPLETED, COMPLETED, CANCELLED]
 *           example: 'PICKUP_ARRIVED'
 *           description: Updated trip status
 *         event:
 *           $ref: '#/components/schemas/TripEvent'
 *           description: Trip event that triggered the status change
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Broadcast timestamp
 *
 *     AlertCreated:
 *       type: object
 *       description: Alert creation broadcast
 *       properties:
 *         alert:
 *           $ref: '#/components/schemas/DriverAlert'
 *           description: The created alert
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Broadcast timestamp
 *
 *     EmergencyAlert:
 *       type: object
 *       description: Emergency alert broadcast
 *       properties:
 *         alert:
 *           $ref: '#/components/schemas/DriverAlert'
 *           description: The emergency alert
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Broadcast timestamp
 *
 *     AlertAcknowledged:
 *       type: object
 *       description: Alert acknowledgment broadcast
 *       properties:
 *         alertId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440004'
 *           description: Acknowledged alert identifier
 *         acknowledgedBy:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440005'
 *           description: User who acknowledged the alert
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Acknowledgment timestamp
 *
 *     TripJoined:
 *       type: object
 *       description: Trip room join confirmation
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Trip identifier
 *         trip:
 *           $ref: '#/components/schemas/TripStatus'
 *           description: Current trip status
 *         currentLocation:
 *           $ref: '#/components/schemas/TripLocation'
 *           description: Current location data
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Join timestamp
 *
 *     TripLeft:
 *       type: object
 *       description: Trip room leave confirmation
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Trip identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Leave timestamp
 *
 *     LocationConfirmed:
 *       type: object
 *       description: Location update confirmation
 *       properties:
 *         locationId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440003'
 *           description: Saved location identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Confirmation timestamp
 *
 *     TripStatusConfirmed:
 *       type: object
 *       description: Trip status update confirmation
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *           description: Trip identifier
 *         status:
 *           type: string
 *           enum: [STARTED, PICKUP_ARRIVED, PICKUP_COMPLETED, DELIVERY_ARRIVED, DELIVERY_COMPLETED, COMPLETED, CANCELLED]
 *           example: 'PICKUP_ARRIVED'
 *           description: Updated trip status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Confirmation timestamp
 *
 *     EmergencyConfirmed:
 *       type: object
 *       description: Emergency alert confirmation
 *       properties:
 *         alertId:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440007'
 *           description: Emergency alert identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Confirmation timestamp
 *
 *     Error:
 *       type: object
 *       description: WebSocket error response
 *       properties:
 *         message:
 *           type: string
 *           example: 'Rate limit exceeded. Please wait before sending more location updates.'
 *           description: Error message
 *         retryAfter:
 *           type: number
 *           example: 15
 *           description: Seconds to wait before retrying (for rate limit errors)
 *
 *     HealthStats:
 *       type: object
 *       description: System health statistics
 *       properties:
 *         connectedClients:
 *           type: number
 *           example: 15
 *           description: Number of active WebSocket connections
 *         driverConnections:
 *           type: number
 *           example: 8
 *           description: Number of driver connections
 *         activeTripRooms:
 *           type: number
 *           example: 12
 *           description: Number of active trip rooms
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00Z'
 *           description: Statistics timestamp
 */

/**
 * WebSocket Events Documentation
 *
 * Client to Server Events:
 *
 * 1. join:trip
 *    - Purpose: Join a trip room to receive real-time updates
 *    - Data: { tripId: string }
 *    - Response: trip:joined event
 *
 * 2. leave:trip
 *    - Purpose: Leave a trip room
 *    - Data: { tripId: string }
 *    - Response: trip:left event
 *
 * 3. location:update
 *    - Purpose: Send GPS location update
 *    - Data: LocationUpdate object
 *    - Rate Limit: 2 updates per 30 seconds
 *    - Response: location:confirmed event
 *
 * 4. trip:status
 *    - Purpose: Update trip status
 *    - Data: TripStatusUpdate object
 *    - Response: trip:status:confirmed event
 *
 * 5. emergency:alert
 *    - Purpose: Send emergency alert
 *    - Data: EmergencyAlert object
 *    - Response: emergency:confirmed event
 *
 * 6. alert:acknowledge
 *    - Purpose: Acknowledge an alert
 *    - Data: { alertId: string }
 *    - Response: None (broadcasts to room)
 *
 * Server to Client Events:
 *
 * 1. connection:confirmed
 *    - Purpose: Confirm successful connection
 *    - Data: ConnectionConfirmed object
 *
 * 2. location:updated
 *    - Purpose: Broadcast location update to trip room
 *    - Data: LocationUpdated object
 *
 * 3. trip:status:updated
 *    - Purpose: Broadcast trip status change
 *    - Data: TripStatusUpdated object
 *
 * 4. alert:created
 *    - Purpose: Broadcast new alert to trip room
 *    - Data: AlertCreated object
 *
 * 5. emergency:alert
 *    - Purpose: Broadcast emergency alert to tenant
 *    - Data: EmergencyAlert object
 *
 * 6. alert:acknowledged
 *    - Purpose: Broadcast alert acknowledgment
 *    - Data: AlertAcknowledged object
 *
 * 7. trip:joined
 *    - Purpose: Confirm trip room join
 *    - Data: TripJoined object
 *
 * 8. trip:left
 *    - Purpose: Confirm trip room leave
 *    - Data: TripLeft object
 *
 * 9. location:confirmed
 *    - Purpose: Confirm location update received
 *    - Data: LocationConfirmed object
 *
 * 10. trip:status:confirmed
 *     - Purpose: Confirm trip status update received
 *     - Data: TripStatusConfirmed object
 *
 * 11. emergency:confirmed
 *     - Purpose: Confirm emergency alert received
 *     - Data: EmergencyConfirmed object
 *
 * 12. error
 *     - Purpose: Send error message to client
 *     - Data: Error object
 *
 * 13. health:stats
 *     - Purpose: Send system health statistics (admin only)
 *     - Data: HealthStats object
 */

/**
 * Authentication and Security
 *
 * 1. JWT Token Required
 *    - All connections must include a valid JWT token
 *    - Token must contain: sub (user ID), tenantId, role
 *    - Driver connections must include driverId in token
 *
 * 2. Tenant Isolation
 *    - All data is filtered by tenant ID
 *    - Users can only access data from their tenant
 *    - Super admins can access any tenant
 *
 * 3. Rate Limiting
 *    - Location updates: 2 per 30 seconds per client
 *    - Automatic cleanup of expired limits
 *    - Rate limit exceeded returns error with retryAfter
 *
 * 4. Room-based Security
 *    - Trip rooms are isolated by trip ID
 *    - Users can only join trips they have access to
 *    - Emergency alerts broadcast to entire tenant
 */

/**
 * Connection Examples
 *
 * JavaScript/Node.js:
 * ```javascript
 * const socket = io('http://localhost:3000/tracking', {
 *   auth: {
 *     token: 'your-jwt-token'
 *   }
 * });
 *
 * // Listen for connection confirmation
 * socket.on('connection:confirmed', (data) => {
 *   console.log('Connected:', data);
 * });
 *
 * // Join trip room
 * socket.emit('join:trip', { tripId: 'trip-uuid' });
 *
 * // Send location update
 * socket.emit('location:update', {
 *   tripId: 'trip-uuid',
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   speed: 65,
 *   heading: 180,
 *   accuracy: 5,
 *   batteryLevel: 85,
 *   isMoving: true,
 *   timestamp: new Date()
 * });
 *
 * // Listen for location updates
 * socket.on('location:updated', (data) => {
 *   console.log('Location updated:', data);
 * });
 * ```
 *
 * Python:
 * ```python
 * import socketio
 *
 * sio = socketio.Client()
 *
 * @sio.event
 * def connect():
 *     print('Connected to tracking server')
 *
 * @sio.event
 * def connection_confirmed(data):
 *     print('Connection confirmed:', data)
 *
 * sio.connect('http://localhost:3000/tracking',
 *            auth={'token': 'your-jwt-token'})
 *
 * sio.emit('join:trip', {'tripId': 'trip-uuid'})
 * sio.emit('location:update', {
 *     'tripId': 'trip-uuid',
 *     'latitude': 40.7128,
 *     'longitude': -74.0060,
 *     'speed': 65,
 *     'timestamp': '2024-01-15T10:30:00Z'
 * })
 * ```
 */

export const WebSocketApiDocumentation = {
  // This export is for TypeScript compilation
  // The actual documentation is in the JSDoc comments above
};
