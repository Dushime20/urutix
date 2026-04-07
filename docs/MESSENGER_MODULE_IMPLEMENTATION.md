# Messenger Module Implementation

## Overview
Created a complete messaging/messenger module for the backend to support real-time communication between users (drivers, shippers, cargo owners, etc.).

## Backend Implementation

### 1. Message Entity
**File:** `backend/src/entities/message.entity.ts`

**Features:**
- UUID primary key
- Thread-based conversation grouping
- Sender and recipient relationships
- Message roles (DRIVER, SHIPPER, CARGO_OWNER, TRUCK_OWNER, DISPATCH, SYSTEM)
- Read/unread status tracking
- Optional trip and load associations
- Tenant isolation
- Timestamps

**Indexes:**
- Sender + Recipient (for conversation queries)
- Thread ID (for thread-based queries)
- Created At (for sorting)
- Is Read (for unread counts)

### 2. Messenger Service
**File:** `backend/src/modules/messenger/messenger.service.ts`

**Methods:**
- `getThreads(userId, tenantId)` - Get all conversation threads for a user
  - Combines sent and received messages
  - Deduplicates participants
  - Includes last message and unread count
  - Sorted by most recent activity

- `getMessages(threadId, userId, tenantId)` - Get all messages in a thread
  - Returns messages in chronological order
  - Includes sender information
  - Filters by tenant for security

- `sendMessage(senderId, recipientId, content, tenantId, options)` - Send a new message
  - Creates thread ID automatically
  - Associates with trip/load if provided
  - Sets sender role based on user role
  - Returns formatted message

- `markAsRead(threadId, userId, tenantId)` - Mark all messages in thread as read
  - Updates all unread messages from participant
  - Tenant-scoped for security

**Thread ID Generation:**
- Deterministic: Always generates same ID for two users regardless of order
- Format: `thread-{userId1}-{userId2}` (sorted alphabetically)
- Ensures single conversation thread between any two users

### 3. Messenger Controller
**File:** `backend/src/modules/messenger/messenger.controller.ts`

**Endpoints:**
- `GET /api/messenger/threads` - Get all threads
- `GET /api/messenger/threads/:threadId/messages` - Get messages in thread
- `POST /api/messenger/send` - Send a message
- `POST /api/messenger/threads/:threadId/read` - Mark thread as read

**Security:**
- JWT authentication required
- Tenant isolation enforced
- User can only access their own conversations

### 4. Database Migration
**File:** `backend/src/migrations/CreateMessagesTable.ts`

**Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  thread_id VARCHAR(255),
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  sender_role ENUM,
  is_read BOOLEAN DEFAULT false,
  trip_id UUID NULL,
  load_id UUID NULL,
  tenant_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- (sender_id, recipient_id)
- (thread_id)
- (created_at)
- (is_read)

**Foreign Keys:**
- sender_id → users(id) ON DELETE SET NULL
- recipient_id → users(id) ON DELETE SET NULL

## Frontend Integration

### Existing Frontend Code
The frontend already has the messenger UI and API service:

**Files:**
- `frontend/src/services/messengerApi.ts` - API service with fallback mock data
- `frontend/src/components/DriverDashboard/DriverMessenger.tsx` - Messenger UI component
- `frontend/src/pages/driver/DriverDashboard.tsx` - Uses messenger in driver dashboard

**Features:**
- Thread list with unread counts
- Real-time message polling (5s interval)
- Thread polling (30s interval)
- Send message functionality
- Mark as read functionality
- Fallback to mock data when API not available

### API Integration
The frontend `messengerApi` service already calls the correct endpoints:
- `GET /messenger/threads`
- `GET /messenger/threads/:threadId/messages`
- `POST /messenger/send`
- `POST /messenger/threads/:threadId/read`

With the backend now implemented, the frontend will automatically use real data instead of fallback mock data.

## Data Flow

### Getting Threads
```
User Opens Messenger → Frontend calls messengerApi.getThreads() →
GET /api/messenger/threads → MessengerController.getThreads() →
MessengerService.getThreads() → Database Query →
Returns threads with last message and unread count →
Frontend displays thread list
```

### Viewing Messages
```
User Clicks Thread → Frontend calls messengerApi.getMessages(threadId) →
GET /api/messenger/threads/:threadId/messages →
MessengerController.getMessages() → MessengerService.getMessages() →
Database Query → Returns all messages in thread →
Frontend displays messages
```

### Sending Message
```
User Types & Sends → Frontend calls messengerApi.sendMessage() →
POST /api/messenger/send → MessengerController.sendMessage() →
MessengerService.sendMessage() → Creates message in database →
Returns new message → Frontend adds to message list →
Polling refreshes thread list
```

### Marking as Read
```
User Views Thread → Frontend calls messengerApi.markAsRead(threadId) →
POST /api/messenger/threads/:threadId/read →
MessengerController.markAsRead() → MessengerService.markAsRead() →
Updates messages in database → Returns success →
Frontend updates unread count
```

## Features

### Implemented
✅ Thread-based conversations
✅ Real-time message polling
✅ Unread message tracking
✅ Multi-role support (Driver, Shipper, Cargo Owner, etc.)
✅ Trip/Load association
✅ Tenant isolation
✅ JWT authentication
✅ Automatic thread ID generation
✅ Last message preview in threads
✅ Chronological message ordering

### Future Enhancements
- WebSocket support for real-time updates (no polling)
- Message attachments (images, documents)
- Message reactions/emojis
- Typing indicators
- Message search
- Message deletion
- Group conversations
- Push notifications
- Message encryption
- Read receipts with timestamps
- Message editing
- Voice messages

## Database Considerations

### Performance
- Indexed on sender_id + recipient_id for fast conversation queries
- Indexed on thread_id for fast message retrieval
- Indexed on created_at for sorting
- Indexed on is_read for unread counts

### Scalability
- Thread ID generation ensures single conversation per user pair
- Tenant isolation prevents cross-tenant data access
- Soft delete support (SET NULL on user deletion)
- Can be partitioned by tenant_id for large deployments

### Data Retention
Consider implementing:
- Message archival after X days
- Automatic cleanup of old messages
- Message export functionality
- Backup strategies

## Testing Recommendations

1. **Thread Management**
   - Test thread creation between different user roles
   - Verify thread ID consistency
   - Test with multiple participants
   - Verify unread counts are accurate

2. **Message Operations**
   - Test sending messages
   - Test receiving messages
   - Test marking as read
   - Test with trip/load associations

3. **Security**
   - Verify tenant isolation
   - Test unauthorized access attempts
   - Verify JWT authentication
   - Test cross-tenant message prevention

4. **Performance**
   - Test with large message volumes
   - Test polling intervals
   - Verify index usage in queries
   - Test concurrent message sending

## Migration Instructions

To apply the messages table migration:

```bash
# Generate migration (if using TypeORM CLI)
npm run migration:generate -- -n CreateMessagesTable

# Run migration
npm run migration:run

# Revert if needed
npm run migration:revert
```

Or manually run the SQL from the migration file.

## API Examples

### Get Threads
```bash
curl -X GET http://localhost:3005/api/messenger/threads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Messages
```bash
curl -X GET http://localhost:3005/api/messenger/threads/thread-123-456/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:3005/api/messenger/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-uuid",
    "content": "Hello, how are you?",
    "tripId": "trip-uuid"
  }'
```

### Mark as Read
```bash
curl -X POST http://localhost:3005/api/messenger/threads/thread-123-456/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

- The frontend already has fallback mock data, so it will work even if the database is empty
- Messages are tenant-scoped for security
- Thread IDs are deterministic and consistent
- The service handles both sent and received messages in thread queries
- Polling intervals can be adjusted in the frontend for different refresh rates
