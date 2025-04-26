# Dialer Service Documentation

## Overview

The dialer service provides functionality for making outbound calls using the Aircall API. It allows users to call clients directly from the dashboard and track call history.

## Configuration

The dialer service requires the following environment variables to be set:

- `AIRCALL_API_KEY`: Aircall API key in the format `api_id:api_token`

Example in your `.env` file:
```
AIRCALL_API_KEY=741a32c4ab34d47a2d2dd929efbfb925:090aaff4ece9c050715ef58bd38d149d
```

## Architecture

The dialer service consists of the following components:

1. **aircallService** (`src/services/dialer/aircallService.js`): Low-level service for making API calls to Aircall.

2. **dialerService** (`src/services/dialer/index.js`): High-level service that uses aircallService to make calls and track call history.

3. **CallRecord Model** (`src/models/CallRecord.js`): MongoDB model for storing call records.

4. **Dialer Controller** (`src/controllers/dialerController.js`): API controllers for handling dialer-related requests.

5. **Dialer Routes** (`src/routes/dialerRoutes.js`): API routes for dialer functionality.

## API Endpoints

All endpoints require authentication using JWT token.

### Make a Call

```
POST /api/dialer/call
```

**Request Body:**
```json
{
  "phoneNumber": "+15551234567",
  "clientId": "60a123b456c789d012e34f56" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "call": {
    "id": "60b123c456d789e012f34g56",
    "phoneNumber": "+15551234567",
    "status": "initiated",
    "startTime": "2023-05-15T12:34:56.789Z"
  }
}
```

### Get Call History

```
GET /api/dialer/history?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "calls": [
    {
      "_id": "60b123c456d789e012f34g56",
      "userId": "60a123b456c789d012e34f56",
      "phoneNumber": "+15551234567",
      "status": "completed",
      "startTime": "2023-05-15T12:34:56.789Z",
      "endTime": "2023-05-15T12:39:56.789Z",
      "duration": 300
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Get Call Details

```
GET /api/dialer/call/:id
```

**Response:**
```json
{
  "success": true,
  "call": {
    "_id": "60b123c456d789e012f34g56",
    "userId": "60a123b456c789d012e34f56",
    "phoneNumber": "+15551234567",
    "status": "completed",
    "startTime": "2023-05-15T12:34:56.789Z",
    "endTime": "2023-05-15T12:39:56.789Z",
    "duration": 300,
    "notes": "Discussed payment options"
  }
}
```

### Update Call Notes

```
PUT /api/dialer/call/:id/notes
```

**Request Body:**
```json
{
  "notes": "Discussed payment options"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call notes updated successfully"
}
```

## Testing

You can test the dialer service using the provided test script:

```
node test-dialer.js +15551234567
```

This will attempt to make a call to the specified phone number using the Aircall API.

## Default Configuration

The dialer service uses the following default configuration:

- Aircall User ID: `1527216`
- Aircall Number ID: `967647`

These can be overridden during initialization or when making calls.