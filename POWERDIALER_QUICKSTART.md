# PowerDialer Quick Start Guide

This guide will help you get started with the new PowerDialer system, which has been completely redesigned with a robust server-based architecture.

## 1. Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Run the automated setup script:
   ```
   npm run setup-powerdialer
   ```

3. Follow the prompts to configure the system:
   - The script will check if Redis is installed
   - It will install required dependencies
   - It will set up environment variables
   - You can enable mock mode for testing without real Aircall credentials

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Access

1. With the backend running, open your browser and navigate to:
   ```
   http://localhost:3000/new-power-dialer
   ```

2. You should see the new PowerDialer interface, which connects to the server-based backend.

## 2. Using the PowerDialer

### Configuration

1. Enter your Aircall credentials:
   - Aircall User ID
   - Aircall Number ID

2. If using mock mode (configured in setup), you can use any values for testing.

### Starting a Dialing Session

1. Click the "Start Dialer" button
2. The system will check your availability with Aircall
3. If available, the dialer will be activated

### Managing Calls

1. The system will pull calls from the queue
2. Call status will be displayed in real-time
3. Call history is recorded for reporting

### Queue Management

The new system supports:
- Adding clients to the call queue
- Setting call priorities
- Scheduling calls for specific times
- Assigning calls to specific agents

## 3. Mock Mode vs. Production Mode

### Mock Mode

- Works without real Aircall credentials
- Simulates call flow for testing
- No actual calls are made
- Set in the `.env` file with `ENABLE_MOCK_MODE=true`

### Production Mode

- Requires valid Aircall API credentials
- Makes real calls through the Aircall API
- Records real call history
- Set in the `.env` file with `ENABLE_MOCK_MODE=false`

## 4. Architecture

The new PowerDialer is built on a robust architecture:

1. **Server-Side Components**:
   - Backend job processor for reliable call scheduling
   - Database storage for call history and queue
   - Webhook handling for real-time events

2. **Frontend Components**:
   - React-based UI for agent interaction
   - Real-time status updates
   - Call history and queue management

## 5. Troubleshooting

### Common Issues

1. **Redis Connection Errors**:
   - Ensure Redis is installed and running
   - Check Redis connection settings in `.env`

2. **Aircall API Issues**:
   - Verify API credentials are correct
   - Enable mock mode for testing without API access

3. **Call Queue Not Processing**:
   - Check if agents are marked as available
   - Verify business hours configuration

### Support

For more detailed information, refer to:
- Backend documentation: `backend/README_POWERDIALER.md`
- Implementation summary: `PowerDialer_Implementation_Summary.md`