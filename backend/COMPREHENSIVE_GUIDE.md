# Date Planner Backend - Comprehensive Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How the Code Works](#how-the-code-works)
4. [Setup Guide](#setup-guide)
5. [API Usage](#api-usage)
6. [Complete User Flows](#complete-user-flows)
7. [Database Schema](#database-schema)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Date Planner backend is a FastAPI application that helps couples plan dates by:
- Authenticating users via Google OAuth
- Linking couples together through invitations
- Accessing both partners' Google Calendars
- Finding mutual free time slots
- Generating AI-powered date suggestions using Claude
- Finding real venues using Google Places API

### Key Features
- 🔐 **Google OAuth Authentication** - Users log in with Google
- 💑 **Couples Linking** - Invitation-based partner connection
- 📅 **Calendar Integration** - Automatic free time detection
- 🤖 **AI-Powered Suggestions** - Claude generates contextual date ideas
- 📍 **Real Venue Discovery** - Google Places finds actual locations
- 🌤️ **Weather-Aware** - Considers forecast in suggestions

---

## Architecture

### Project Structure
```
backend/
├── app/
│   ├── api/v1/              # API endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── couples.py       # Couples management endpoints
│   │   ├── dates.py         # Date generation endpoints
│   │   └── routers.py       # API router configuration
│   │
│   ├── clients/             # External service clients
│   │   ├── db.py            # Supabase database client
│   │   ├── google_calendar.py  # Google Calendar API
│   │   ├── claude.py        # Claude AI client (placeholder)
│   │   ├── google.py        # Google Places client (placeholder)
│   │   └── weather.py       # Weather API client (placeholder)
│   │
│   ├── core/                # Core application code
│   │   ├── models.py        # Pydantic data models
│   │   └── dependencies.py  # FastAPI dependencies (JWT auth)
│   │
│   ├── services/            # Business logic
│   │   ├── auth.py          # Authentication service
│   │   ├── couples.py       # Couples service
│   │   └── date_generator.py  # Date generation service
│   │
│   ├── config.py            # Configuration management
│   └── main.py              # FastAPI application entry point
│
├── .env                     # Environment variables
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
└── COMPREHENSIVE_GUIDE.md   # This file
```

### Technology Stack
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with auth
- **Google OAuth 2.0** - User authentication
- **Google Calendar API** - Calendar access
- **Google Places API** - Venue discovery
- **Anthropic Claude** - AI date suggestions
- **OpenWeather API** - Weather forecasts
- **JWT** - Token-based authentication
- **Pydantic** - Data validation

---

## How the Code Works

### 1. Authentication Flow (Google OAuth)

**File: `app/services/auth.py`**

```
User → Frontend → GET /api/v1/auth/google/login
                  ↓
         Returns Google OAuth URL
                  ↓
User clicks → Redirects to Google
                  ↓
      User approves in Google
                  ↓
Google → GET /api/v1/auth/google/callback?code=...
                  ↓
         AuthService.handle_oauth_callback():
           1. Exchange code for tokens
           2. Get user info from Google
           3. Create/update user in database
           4. Store google_refresh_token
           5. Generate JWT token
                  ↓
         Returns JWT + user info
```

**Key Components:**

**`AuthService.get_google_auth_url()`**
- Creates Google OAuth flow
- Generates authorization URL
- Requests scopes: Calendar, Email, Profile

**`AuthService.handle_oauth_callback(code)`**
- Exchanges authorization code for tokens
- Fetches user profile from Google
- Stores refresh token in database (for later calendar access)
- Creates JWT for future API calls

**`AuthService._create_access_token(user_id)`**
- Creates JWT with 7-day expiration
- Payload: `{"sub": user_id, "exp": timestamp}`
- Signed with JWT_SECRET_KEY

**Database Operation:**
```python
# Check if user exists by email
existing_user = db.table('users').select('*').eq('email', email)

if existing_user:
    # Update refresh token
    db.table('users').update({
        'google_refresh_token': new_token
    }).eq('email', email)
else:
    # Create new user
    db.table('users').insert({
        'email': email,
        'full_name': full_name,
        'google_refresh_token': refresh_token
    })
```

---

### 2. Couples Invitation System

**File: `app/services/couples.py`**

```
User 1 (Inviter)
    ↓
POST /api/v1/couples/invite
    body: {"invitee_email": "partner@email.com"}
    ↓
CouplesService.create_invitation():
    1. Verify inviter not already in couple
    2. Generate unique token (32 bytes)
    3. Set expiration (7 days)
    4. Store in 'invitations' table
    ↓
Returns: {invitation_id, token, expires_at}
    ↓
User 1 shares token with User 2
    ↓
User 2 (Invitee) logs in
    ↓
POST /api/v1/couples/accept
    body: {"token": "..."}
    ↓
CouplesService.accept_invitation():
    1. Find invitation by token
    2. Verify not expired
    3. Verify invitee email matches
    4. Verify neither user in couple
    5. Create couple record
    6. Mark invitation as 'accepted'
    ↓
Returns: {couple_id, partner_info}
```

**Key Validations:**

**In `create_invitation()`:**
- ✅ Inviter doesn't already have a partner
- ✅ Not inviting themselves
- ✅ No duplicate pending invitation

**In `accept_invitation()`:**
- ✅ Token exists and valid
- ✅ Invitation not expired
- ✅ Accepter's email matches invitation
- ✅ Neither user already in a couple

**Database Schema:**
```sql
-- invitations table
{
  id: uuid,
  inviter_id: uuid → users.id,
  invitee_email: text,
  token: text (unique),
  status: text ('pending', 'accepted', 'expired'),
  created_at: timestamp,
  expires_at: timestamp
}

-- couples table
{
  id: uuid,
  partner1_id: uuid → users.id,
  partner2_id: uuid → users.id,
  created_at: timestamp
}
```

---

### 3. Google Calendar Integration

**File: `app/clients/google_calendar.py`**

**How Calendar Access Works:**

```
User has google_refresh_token stored
    ↓
GoogleCalendarClient._get_credentials(user_id):
    1. Fetch refresh_token from database
    2. Create Credentials object
    3. Exchange refresh_token for access_token
    4. Return valid credentials
    ↓
GoogleCalendarClient.get_events(user_id, start, end):
    1. Get credentials
    2. Build Calendar API service
    3. Call calendar.events().list()
    4. Return formatted events
```

**Finding Free Time Slots:**

```python
# Algorithm from your pseudocode (Algorithm 1)
free_slots = GoogleCalendarClient.find_free_slots(
    user1_id, user2_id, start, end
)

# Process:
1. Get all events for User 1
2. Get all events for User 2
3. Combine busy times: busy_times = events1 + events2
4. Sort by start time
5. Find gaps between busy periods:
   - If gap >= 2 hours → add to free_slots
6. Return list of free slots with:
   {start, end, duration_hours}
```

**Example:**
```
User 1 Calendar:
  9am-10am: Meeting
  2pm-3pm: Lunch

User 2 Calendar:
  10am-12pm: Class
  4pm-5pm: Gym

Combined Busy Times:
  9am-10am, 10am-12pm, 2pm-3pm, 4pm-5pm

Free Slots Found:
  12pm-2pm (2 hours)
  3pm-4pm (1 hour) - skipped (< 2 hours)
  After 5pm (variable)
```

---

### 4. Date Generation (Main Algorithm)

**File: `app/services/date_generator.py`**

This implements **Algorithm 1 & 2** from your pseudocode.

```
POST /api/v1/dates/generate-couple-date-plan
    body: {
        prompt: "cozy italian restaurant",
        location: "New York, NY",
        time_frame_days: 7
    }
    headers: {
        Authorization: "Bearer <jwt_token>"
    }
    ↓

DateGeneratorService.generate_couple_date_plan():

STEP 1: Get Couple Information
    - Extract user_id from JWT
    - Query couples table
    - Get partner1_id and partner2_id

STEP 2: Find Free Time (Algorithm 1)
    - Calculate timeframe: today → today + 7 days
    - Call GoogleCalendarClient.find_free_slots()
    - Returns: [{start, end, duration}, ...]

STEP 3: Get Weather Context
    - Call WeatherClient.get_weather(location, timeframe)
    - Returns: {forecast: "Sunny, 75°F"}

STEP 4: Get Calendar Context
    - Call GoogleCalendarClient.get_events_context()
    - Returns schedule summaries for both users
    - Example: "Nov 20: Exam, Nov 21: Team Meeting"

STEP 5: Generate AI Prompt (Algorithm 2)
    Build comprehensive prompt:
    """
    Generate date ideas based on:

    User's Request: cozy italian restaurant
    Location: New York, NY
    Weather: Sunny, 75°F

    Available Free Time:
    1. Friday, Nov 15 at 6:00 PM (3 hours)
    2. Saturday, Nov 16 at 2:00 PM (5 hours)

    Partner 1's Schedule:
    - Nov 15: Project deadline
    - Nov 16: Free day

    Partner 2's Schedule:
    - Nov 15: Exam in morning
    - Nov 16: Free day

    Suggest dates that:
    1. Match the request
    2. Fit the free time
    3. Consider the weather
    4. Account for their schedules
       (e.g., relaxing dinner after stressful exam)
    """

STEP 6: Get Ideas from Claude
    - Call ClaudeClient.generate_ideas(prompt)
    - Returns: ["Romantic Italian dinner at sunset", ...]

STEP 7: Find Real Venues
    For each idea:
        - Call GoogleClient.find_place(idea + location)
        - Returns: {name, address}
        - Create Event object with:
            * name: venue name
            * reason: why it's good
            * suggested_time: first free slot

STEP 8: Return Response
    {
        events: [
            {
                name: "Carbone",
                reason: "Upscale Italian, perfect for...",
                suggested_time: "2024-11-15T18:00:00Z"
            },
            ...
        ],
        free_time_slots: [
            {start, end, duration_hours},
            ...
        ]
    }
```

**Key Features:**

1. **Context-Aware:** Considers schedules (e.g., suggests relaxing activity after exam)
2. **Weather-Aware:** Won't suggest outdoor picnic in rain
3. **Time-Optimized:** Only suggests during mutual free time
4. **Real Venues:** Uses Google Places to find actual restaurants/locations

---

### 5. JWT Authentication Middleware

**File: `app/core/dependencies.py`**

**How Protected Endpoints Work:**

```python
# Endpoint definition
@router.get("/couples/partner")
def get_partner(
    current_user: User = Depends(get_current_user)
):
    # current_user is automatically populated
    return couple_service.get_partner(current_user.id)
```

**The `get_current_user` dependency:**

```
1. Extract JWT from Authorization header
   Header: "Bearer eyJhbGc..."

2. Decode JWT with secret key
   Payload: {"sub": "user-uuid", "exp": 1234567890}

3. Verify not expired
   if exp < now → raise 401 Unauthorized

4. Extract user_id from "sub" claim

5. Fetch user from database
   user = db.table('users').select('*').eq('id', user_id)

6. Return User object
   → Now available in endpoint as current_user
```

**Error Handling:**
- Missing token → 401 Unauthorized
- Invalid signature → 401 Unauthorized
- Expired token → 401 Unauthorized
- User not found → 401 Unauthorized

---

## Setup Guide

### Prerequisites
- Python 3.10+
- Supabase account (or local Supabase)
- Google Cloud account
- Anthropic API key
- Google Maps API key
- OpenWeather API key

### Step 1: Install Dependencies

```bash
cd backend

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install packages
pip install -r requirements.txt
```

### Step 2: Set Up Supabase

**Option A: Local Supabase (Recommended for Development)**

```bash
cd ../supabase
npx supabase start
```

This will output:
```
API URL: http://localhost:54321
anon key: eyJhbG...
service_role key: eyJhbG...
```

**Option B: Supabase Cloud**

1. Go to https://app.supabase.com
2. Create new project
3. Copy API URL and anon key

**Database is Already Set Up!** Your tables (users, couples, invitations, etc.) should already exist based on your schema.

### Step 3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Google People API
   - Google Places API
4. Create OAuth 2.0 credentials:
   - **Application type:** Web application
   - **Authorized redirect URIs:**
     - `http://localhost:8000/api/v1/auth/google/callback`
     - (Add your production URL later)
5. Copy Client ID and Client Secret

### Step 4: Get API Keys

**Anthropic Claude:**
- Go to https://console.anthropic.com
- Create API key

**Google Maps:**
- In Google Cloud Console
- APIs & Services → Credentials
- Create API Key
- Enable Places API

**OpenWeather:**
- Go to https://openweathermap.org/api
- Sign up for free tier
- Copy API key

### Step 5: Configure Environment

```bash
cd backend
cp .env.example .env
nano .env  # or use your preferred editor
```

Fill in all values:
```bash
# Application
APP_ENV=development

# Supabase (from Step 2)
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbG...

# Google OAuth (from Step 3)
GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your-super-secret-random-string-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# API Keys (from Step 4)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_MAPS_API_KEY=AIza...
OPENWEATHER_API_KEY=abc123...
```

### Step 6: Run the Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 7: Test the API

Open browser: http://localhost:8000/docs

You'll see the Swagger UI with all endpoints!

---

## API Usage

### Authentication

#### 1. Initiate Login

**Request:**
```http
GET /api/v1/auth/google/login
```

**Response:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

**Usage:**
- Redirect user to `auth_url`
- User logs in with Google
- Google redirects to callback URL

#### 2. Handle Callback (Automatic)

**Request:**
```http
GET /api/v1/auth/google/callback?code=4/0AY0e...
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-11-14T12:00:00Z"
  }
}
```

**Usage:**
- Store `access_token` in frontend
- Use for all subsequent requests

#### 3. Get Current User

**Request:**
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-11-14T12:00:00Z"
}
```

---

### Couples Management

#### 1. Create Invitation

**Request:**
```http
POST /api/v1/couples/invite
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "invitee_email": "partner@example.com"
}
```

**Response:**
```json
{
  "invitation_id": "987fcdeb-51a2-43f7-8b6d-426614174111",
  "invitee_email": "partner@example.com",
  "token": "k8Js9dKl2mN4pQ6rS8tU0vW2xY4zA6bC",
  "expires_at": "2024-11-21T12:00:00Z"
}
```

**Usage:**
- Share `token` with your partner (via text, email, etc.)
- They'll use it to accept

#### 2. Accept Invitation

**Request:**
```http
POST /api/v1/couples/accept
Authorization: Bearer eyJhbGci...  (partner's token)
Content-Type: application/json

{
  "token": "k8Js9dKl2mN4pQ6rS8tU0vW2xY4zA6bC"
}
```

**Response:**
```json
{
  "couple_id": "456def12-3456-7890-abcd-426614174222",
  "partner": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-11-14T12:00:00Z"
  },
  "created_at": "2024-11-14T13:00:00Z"
}
```

#### 3. Get Partner Info

**Request:**
```http
GET /api/v1/couples/partner
Authorization: Bearer eyJhbGci...
```

**Response:**
```json
{
  "couple_id": "456def12-3456-7890-abcd-426614174222",
  "partner": {
    "id": "789ghi34-5678-9012-cdef-426614174333",
    "email": "partner@example.com",
    "full_name": "Jane Smith",
    "created_at": "2024-11-14T12:30:00Z"
  },
  "created_at": "2024-11-14T13:00:00Z"
}
```

---

### Date Generation

#### Generate Couple Date Plan (Calendar-Aware)

**Request:**
```http
POST /api/v1/dates/generate-couple-date-plan
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "prompt": "cozy italian restaurant",
  "location": "New York, NY",
  "time_frame_days": 7
}
```

**Response:**
```json
{
  "events": [
    {
      "name": "Carbone",
      "reason": "Upscale Italian restaurant perfect for a romantic evening. Known for classic dishes and intimate atmosphere.",
      "suggested_time": "2024-11-15T19:00:00Z"
    },
    {
      "name": "L'Artusi",
      "reason": "Cozy West Village Italian spot with excellent wine selection.",
      "suggested_time": "2024-11-16T18:30:00Z"
    }
  ],
  "free_time_slots": [
    {
      "start": "2024-11-15T19:00:00Z",
      "end": "2024-11-15T22:00:00Z",
      "duration_hours": 3.0
    },
    {
      "start": "2024-11-16T14:00:00Z",
      "end": "2024-11-16T19:00:00Z",
      "duration_hours": 5.0
    }
  ]
}
```

**Parameters:**
- `prompt`: Type of date (e.g., "cozy italian", "outdoor adventure", "jazz concert")
- `location`: City/area to search
- `time_frame_days`: How many days ahead to search (default: 7)

---

## Complete User Flows

### Flow 1: New Users Meeting for First Date

```
Day 1: User Registration
├── Alice visits app
├── Clicks "Sign in with Google"
├── GET /api/v1/auth/google/login
├── Redirects to Google
├── Alice approves access
├── Google → /api/v1/auth/google/callback
├── Alice receives JWT token
└── Alice logged in ✓

Same for Bob:
├── Bob visits app
├── Signs in with Google
├── Receives JWT token
└── Bob logged in ✓

Day 1: Couple Linking
├── Alice creates invitation
├── POST /api/v1/couples/invite
│   body: {"invitee_email": "bob@example.com"}
├── Receives token: "k8Js9dKl..."
├── Alice texts Bob: "Use this code: k8Js9dKl..."
│
├── Bob receives code
├── POST /api/v1/couples/accept
│   body: {"token": "k8Js9dKl..."}
├── Couple created ✓
└── Both can now generate dates

Day 2: Planning First Date
├── Alice opens app
├── Clicks "Plan a Date"
├── Enters:
│   - "romantic dinner restaurant"
│   - "San Francisco, CA"
│   - "next 3 days"
│
├── POST /api/v1/dates/generate-couple-date-plan
│
├── Backend Process:
│   1. Fetches Alice's calendar
│   2. Fetches Bob's calendar
│   3. Finds they're both free:
│      - Tomorrow (Fri) 7pm-10pm
│      - Saturday 2pm-11pm
│   4. Gets weather: "Clear, 68°F"
│   5. Asks Claude for suggestions
│   6. Claude suggests romantic spots
│   7. Google Places finds:
│      - "Gary Danko" - Fine dining
│      - "Foreign Cinema" - Romantic ambiance
│   8. Returns suggestions
│
├── Alice sees:
│   ✓ 2 restaurant suggestions
│   ✓ Suggested times: Fri 7pm or Sat 6pm
│   ✓ Reasons why each is perfect
│
├── Alice books Gary Danko for Friday 7pm
└── First date planned! 🎉
```

---

### Flow 2: Couple Planning Weekly Dates

```
Ongoing: Regular Date Planning
├── Every week, Alice or Bob opens app
│
├── This week Bob suggests:
│   - "outdoor park picnic"
│   - "Boston, MA"
│   - "next 7 days"
│
├── POST /api/v1/dates/generate-couple-date-plan
│
├── Backend analyzes:
│   - Alice has exam Tuesday
│   - Bob has meetings Mon-Wed
│   - Both free Thursday afternoon
│   - Weather: Rainy Mon-Wed, Sunny Thu-Fri
│
├── Claude suggests:
│   - Thursday picnic (sunny + both relaxed after busy week)
│   - Friday afternoon park walk
│
├── Returns:
│   events: [
│     {
│       name: "Boston Common",
│       reason: "Perfect for picnic, sunny weather, both free and relaxed after busy week"
│       suggested_time: "Thursday 3pm"
│     }
│   ]
│
└── Date planned around their schedules! ✓
```

---

## Database Schema

### Tables Overview

```sql
-- Users table (managed by Supabase Auth + custom fields)
users {
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  full_name: text,
  google_refresh_token: text,  -- For calendar access
  created_at: timestamptz
}

-- Couples table
couples {
  id: uuid PRIMARY KEY,
  partner1_id: uuid → users.id,
  partner2_id: uuid → users.id,
  created_at: timestamptz
}

-- Invitations table
invitations {
  id: uuid PRIMARY KEY,
  inviter_id: uuid → users.id,
  invitee_email: text,
  token: text UNIQUE,
  status: text,  -- 'pending', 'accepted', 'expired'
  created_at: timestamptz,
  expires_at: timestamptz
}

-- Date plans table (for saving plans)
date_plans {
  id: uuid PRIMARY KEY,
  couple_id: uuid → couples.id,
  plan_name: text,
  status: text,
  venue_name: text,
  address: text,
  reasoning_text: text,
  suggested_date: timestamptz,
  created_at: timestamptz
}

-- Flower cards table (bonus feature)
flower_cards {
  id: uuid PRIMARY KEY,
  couple_id: uuid → couples.id,
  recipient_id: uuid → users.id,
  giver_id: uuid → users.id,
  flower_type: text,
  purchase_date: date,
  vase_life_days: int,
  photo_url: text,
  care_tips: jsonb,
  special_tips: jsonb,
  is_active: bool,
  reminder_date: date,
  reminder_sent: bool,
  created_at: timestamptz
}
```

---

## Development Guide

### Project Conventions

**1. Layered Architecture:**
```
API Layer (routes)
    ↓
Service Layer (business logic)
    ↓
Client Layer (external APIs)
    ↓
Database Layer (Supabase)
```

**2. Dependency Injection:**
```python
# Services get injected into routes
@router.post("/invite")
def create_invite(
    service: CouplesService = Depends(get_couples_service)
):
    return service.create_invitation(...)

# Clients get injected into services
class DateGeneratorService:
    def __init__(
        self,
        claude: ClaudeClient = Depends(get_claude_client),
        calendar: CalendarClient = Depends(get_calendar_client)
    ):
        self.claude = claude
        self.calendar = calendar
```

**3. Pydantic Models:**
- Request validation
- Response serialization
- Type safety

**4. Error Handling:**
```python
try:
    result = service.do_something()
    return result
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### Adding New Features

#### Example: Adding a "Save Date Plan" Feature

**Step 1: Add Pydantic Model**
```python
# app/core/models.py
class SaveDatePlanRequest(BaseModel):
    event_name: str
    venue_name: str
    address: str
    scheduled_time: datetime
    reasoning: str
```

**Step 2: Add Service Method**
```python
# app/services/date_generator.py
def save_date_plan(
    self,
    user_id: UUID,
    request: SaveDatePlanRequest
) -> DatePlan:
    # Get user's couple
    couple = self._get_user_couple(user_id)

    # Save to database
    result = self.db.table('date_plans').insert({
        'couple_id': str(couple['id']),
        'plan_name': request.event_name,
        'venue_name': request.venue_name,
        'address': request.address,
        'suggested_date': request.scheduled_time,
        'reasoning_text': request.reasoning,
        'status': 'planned'
    }).execute()

    return DatePlan(**result.data[0])
```

**Step 3: Add API Endpoint**
```python
# app/api/v1/dates.py
@router.post("/save-plan")
def save_plan(
    request: SaveDatePlanRequest,
    current_user: User = Depends(get_current_user),
    service: DateGeneratorService = Depends(get_date_generator_service)
):
    return service.save_date_plan(current_user.id, request)
```

**Done!** The endpoint is automatically available at:
```
POST /api/v1/dates/save-plan
```

### Running Tests

```bash
# Install pytest
pip install pytest pytest-asyncio httpx

# Create test file
# tests/test_auth.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_google_login_returns_url():
    response = client.get("/api/v1/auth/google/login")
    assert response.status_code == 200
    assert "auth_url" in response.json()

# Run tests
pytest tests/
```

### Debugging Tips

**1. Check Logs:**
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"User {user_id} created invitation")
logger.error(f"Failed to fetch calendar: {e}")
```

**2. Use Debugger:**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

**3. Test Individual Components:**
```bash
# Test calendar client
python -c "
from app.clients.google_calendar import GoogleCalendarClient
from uuid import UUID

client = GoogleCalendarClient()
events = client.get_events(
    UUID('user-id'),
    datetime.now(),
    datetime.now() + timedelta(days=7)
)
print(events)
"
```

**4. Interactive API Testing:**
- Use Swagger UI: http://localhost:8000/docs
- Try endpoints with "Try it out" button
- View request/response schemas

---

## Troubleshooting

### Common Issues

#### 1. "Invalid API key" (Supabase)

**Symptom:**
```
supabase._sync.client.SupabaseException: Invalid API key
```

**Solution:**
- Check `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`
- If using local Supabase: `cd supabase && npx supabase start`
- Copy the "anon key" from output
- Update `.env`

#### 2. "Failed to authenticate with Google"

**Symptom:**
```
HTTPException: Failed to authenticate with Google: invalid_grant
```

**Solutions:**
- **Check redirect URI:** Must match exactly in Google Console
- **Check client credentials:** Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Token expired:** User needs to re-authenticate

#### 3. "User not in a couple"

**Symptom:**
```
ValueError: You must be in a couple to use this feature
```

**Solution:**
- User needs to create/accept invitation first
- Check: `GET /api/v1/couples/partner`
- If returns 404 → not linked yet

#### 4. "No mutual free time found"

**Symptom:**
```
ValueError: No mutual free time found in the specified time frame
```

**Solutions:**
- Both calendars are fully booked
- Try longer timeframe: `time_frame_days: 14`
- Check calendar access permissions
- Verify both users granted calendar permissions

#### 5. Import Errors

**Symptom:**
```
ModuleNotFoundError: No module named 'supabase'
```

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### 6. JWT Token Errors

**Symptom:**
```
401 Unauthorized: Invalid authentication credentials
```

**Solutions:**
- Token expired (7 days) → user needs to login again
- Check `JWT_SECRET_KEY` in `.env` didn't change
- Verify token in Authorization header: `Bearer <token>`

---

## Performance Optimization

### Caching Strategies

**1. Cache Calendar Events:**
```python
# Cache for 15 minutes
from functools import lru_cache
import time

@lru_cache(maxsize=100)
def get_events_cached(user_id, start, end):
    return self.get_events(user_id, start, end)
```

**2. Batch Database Queries:**
```python
# Instead of:
for user_id in user_ids:
    user = db.table('users').select('*').eq('id', user_id).execute()

# Do:
users = db.table('users').select('*').in_('id', user_ids).execute()
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/dates/generate-couple-date-plan")
@limiter.limit("5/minute")  # 5 requests per minute
def generate_dates(...):
    ...
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ **Never** commit `.env` to git
- ✅ Use different keys for dev/prod
- ✅ Rotate JWT secret regularly

### 2. API Keys
- ✅ Restrict Google API keys to specific domains/IPs
- ✅ Use separate keys per environment
- ✅ Enable only required API scopes

### 3. Database
- ✅ Use Supabase RLS (Row Level Security)
- ✅ Never expose service_role key
- ✅ Validate all user inputs

### 4. JWT Tokens
- ✅ Short expiration (7 days max)
- ✅ Implement refresh token flow for longer sessions
- ✅ Use HTTPS in production

---

## Deployment Guide

### Deploy to Production

**1. Environment Setup:**
```bash
# Production .env
APP_ENV=production
SUPABASE_URL=https://your-project.supabase.co
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback
```

**2. Update Google OAuth:**
- Add production domain to authorized redirects
- Add production domain to authorized JavaScript origins

**3. Use Production Server:**
```bash
# Install gunicorn
pip install gunicorn

# Run with workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

**4. Set Up HTTPS:**
- Use Let's Encrypt for SSL certificates
- Configure nginx as reverse proxy

**5. Monitor:**
- Set up logging aggregation
- Monitor API response times
- Track error rates

---

## FAQ

**Q: Why Google OAuth instead of email/password?**
A: Google OAuth provides:
- Secure authentication (no password storage)
- Automatic calendar access
- Better UX (one-click login)

**Q: Can I use this without Google Calendar?**
A: The calendar-aware date generation requires calendar access. You can use the legacy endpoint `/dates/generate-date-plan` without authentication, but it won't consider schedules.

**Q: How is the google_refresh_token kept secure?**
A: Stored encrypted in Supabase, never exposed in API responses, only used server-side to access calendars.

**Q: Can more than 2 people form a couple?**
A: Currently designed for pairs. To support groups, you'd need to modify the `couples` table schema and business logic.

**Q: How accurate are the free time slots?**
A: Very accurate - directly reads from Google Calendar. However, it only knows about events in the calendar. If users have commitments not in their calendar, those won't be detected.

---

## Next Steps

### Enhancements to Consider

1. **Notifications:**
   - Email reminders for dates
   - Push notifications for invitations

2. **Saved Preferences:**
   - Favorite cuisines
   - Preferred date types
   - Budget ranges

3. **Date History:**
   - Save completed dates
   - Rate experiences
   - Build recommendation profile

4. **Social Features:**
   - Share date ideas with friends
   - Public/private date plan templates

5. **Advanced Calendar:**
   - Suggest optimal date times based on patterns
   - Auto-reschedule if conflicts arise
   - Multi-day date planning (weekend trips)

---

## Support & Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Supabase Docs:** https://supabase.com/docs
- **Google Calendar API:** https://developers.google.com/calendar
- **Anthropic Claude:** https://docs.anthropic.com
- **Pydantic:** https://docs.pydantic.dev

---

## License

This project is for educational/personal use.

---

*Last Updated: November 14, 2024*
*Version: 1.0.0*
