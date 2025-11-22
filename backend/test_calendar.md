# Testing Calendar API

## Method 1: Using FastAPI Swagger UI (Recommended)

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate  # or: . venv/bin/activate
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. Open your browser to: http://localhost:8000/docs

3. Test the calendar endpoint:
   - Find **POST /api/v1/calendar/add-event**
   - Click "Try it out"
   - You'll need a valid JWT token (login first to get one)
   - Fill in the request body:
     ```json
     {
       "summary": "Test Date Event",
       "start_time": "2025-11-25T18:00:00Z",
       "end_time": "2025-11-25T20:00:00Z",
       "location": "Test Restaurant",
       "description": "Testing calendar integration"
     }
     ```
   - Click "Execute"

## Method 2: Using the Python Test Script

Run the test script I created:
```bash
cd backend
python test_calendar_endpoint.py
```

This will test:
- ✅ Endpoint exists and responds
- ✅ Request/response format is correct
- ✅ Mock calendar client works
- ✅ Error handling works

## Expected Responses

**Success (200):**
```json
{
  "success": true,
  "event_id": "mock_event_123",
  "event_link": "https://calendar.google.com/calendar/mock",
  "message": "Event 'Test Date Event' added to your calendar!"
}
```

**No Calendar Connected (428):**
```json
{
  "detail": "User {user_id} has no Google Calendar access"
}
```

**Unauthorized (401):**
```json
{
  "detail": "Not authenticated"
}
```

## Troubleshooting

- **401 Error**: Need to login first and get a JWT token
- **428 Error**: User needs to connect Google Calendar (normal for new users)
- **500 Error**: Check backend logs for details
