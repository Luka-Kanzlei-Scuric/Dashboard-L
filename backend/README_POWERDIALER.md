# PowerDialer System Architecture

## Overview
The PowerDialer is a robust, server-based call system that integrates with Aircall to automate outbound calling campaigns. This system is designed for reliability, scalability, and efficient call handling with features for queueing, scheduling, and analytics.

## System Components

### 1. Core Application Server
- **Technology**: Node.js/Express
- **Main Files**:
  - `server.js` - Server initialization and route configuration
  - `/src/controllers/dialerController.js` - API endpoints handling
  - `/src/routes/dialerRoutes.js` - Route definitions

### 2. Database Models
- **Technology**: MongoDB/Mongoose
- **Models**:
  - `CallQueue` - Queue of calls to be made
  - `CallHistory` - Record of completed calls
  - `UserStatus` - Agent availability tracking
  - `SystemConfig` - System configuration parameters

### 3. Service Layer
- **AircallService**:
  - Manages all Aircall API interactions
  - Handles webhook event processing
  - Provides mock capabilities for testing

- **JobService**:
  - Background job processing using Bull/Redis
  - Call scheduling and queue management
  - Periodic maintenance tasks

### 4. API Endpoints

#### System Management
- `POST /api/dialer/initialize` - Initialize services
- `GET /api/dialer/config` - Get system configuration
- `POST /api/dialer/config` - Update system configuration

#### PowerDialer Control
- `POST /api/dialer/start/:userId` - Start PowerDialer for an agent
- `POST /api/dialer/pause/:userId` - Pause PowerDialer
- `POST /api/dialer/stop/:userId` - Stop PowerDialer
- `GET /api/dialer/status/:userId` - Get agent status
- `GET /api/dialer/agents` - Get all available agents

#### Queue Management
- `POST /api/dialer/queue` - Add clients to call queue
- `GET /api/dialer/queue` - Get all queued calls
- `GET /api/dialer/queue/:userId` - Get calls assigned to agent
- `PUT /api/dialer/queue/:queueItemId` - Update queue item
- `DELETE /api/dialer/queue/:queueItemId` - Remove from queue

#### Call History and Stats
- `GET /api/dialer/history` - Get call history
- `GET /api/dialer/stats` - Get call statistics

#### Webhooks
- `POST /api/dialer/webhook` - Process Aircall events

## Data Flow

### 1. Call Initiation Flow
1. Frontend adds clients to call queue via `/api/dialer/queue`
2. JobService polls the queue every minute for pending calls
3. Available agents are identified and assigned to calls
4. Calls are initiated via AircallService to the Aircall API
5. Call status is tracked in CallHistory

### 2. Webhook Processing Flow
1. Aircall sends event notifications to `/api/dialer/webhook`
2. Events are queued in JobService for asynchronous processing
3. Processed events update CallHistory and UserStatus records
4. When calls end, the next call in queue is scheduled

### 3. Agent Management Flow
1. Agent starts PowerDialer via `/api/dialer/start/:userId`
2. Agent status is updated in UserStatus model
3. Agent availability is checked periodically
4. When an agent stops the PowerDialer, active calls are ended

## Configuration

The system uses a centralized configuration store with the following categories:

1. **General Settings**
   - System name and basic parameters

2. **Dialer Settings**
   - Call rate limits
   - Retry parameters
   - Queue management rules

3. **Aircall Settings**
   - API credentials
   - Default phone numbers
   - Integration parameters

4. **Scheduling Settings**
   - Business hours configuration
   - Time zone handling
   - Calendar integration

## Dependencies

- **Bull**: Job queuing system
- **Redis**: Backend for Bull and caching
- **Mongoose**: MongoDB object modeling
- **Express**: Web framework
- **Axios**: HTTP client for API calls

## Installation

1. Install required dependencies:
   ```
   npm install
   ```

2. Ensure Redis is installed and running:
   ```
   redis-server
   ```

3. Configure environment variables in `.env`:
   ```
   AIRCALL_API_KEY=your_api_key
   AIRCALL_API_SECRET=your_api_secret
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. Start the server:
   ```
   npm run start
   ```

## Testing

For testing without an Aircall API key, the system provides a comprehensive mock mode:

1. In environment:
   ```
   ENABLE_MOCK_MODE=true
   ```

2. For individual API calls:
   ```
   POST /api/dialer/start/:userId
   {
     "aircallUserId": "test",
     "numberId": "test",
     "useMockMode": true
   }
   ```

## Monitoring

Background jobs can be monitored through:

- `GET /api/dialer/jobs/status` - Overall job queue status
- Redis monitoring tools like Bull Board

Call statistics are available through:

- `GET /api/dialer/stats` - Historical and real-time stats

## Scaling Considerations

The system is designed for horizontal scaling:

1. Multiple Express instances can be deployed behind a load balancer
2. Redis can be configured as a cluster for high availability
3. MongoDB can be sharded for high volume operations