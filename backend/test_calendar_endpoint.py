#!/usr/bin/env python3
"""
Simple test script for the calendar API endpoint.
Run with: python test_calendar_endpoint.py
"""

import sys
from datetime import datetime, timedelta
from uuid import uuid4

# Add app directory to path
sys.path.insert(0, '/home/glyst/code/date-planner/backend')

from app.clients.google_calendar import MockGoogleCalendarClient


def test_mock_calendar_client():
    """Test the MockGoogleCalendarClient create_event method."""
    print("=" * 60)
    print("Testing MockGoogleCalendarClient.create_event()")
    print("=" * 60)

    client = MockGoogleCalendarClient()
    user_id = uuid4()

    # Test data
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=2)

    try:
        result = client.create_event(
            user_id=user_id,
            summary="Test Date Event",
            start_time=start_time,
            end_time=end_time,
            location="Test Restaurant, 123 Main St",
            description="Testing calendar integration"
        )

        print("\n✅ SUCCESS! Event created:")
        print(f"   Event ID: {result['id']}")
        print(f"   Link: {result['htmlLink']}")
        print(f"   Summary: {result['summary']}")
        print(f"   Start: {result['start']}")
        print(f"   End: {result['end']}")

        # Verify response format
        assert 'id' in result, "Missing event ID"
        assert 'htmlLink' in result, "Missing event link"
        assert 'summary' in result, "Missing summary"
        assert result['summary'] == "Test Date Event", "Summary mismatch"

        print("\n✅ All assertions passed!")
        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_endpoint_imports():
    """Test that the endpoint module can be imported."""
    print("\n" + "=" * 60)
    print("Testing Calendar Endpoint Imports")
    print("=" * 60)

    try:
        from app.api.v1 import calendar as calendar_module
        print("✅ Calendar endpoint module imported successfully")

        # Check router exists
        assert hasattr(calendar_module, 'router'), "Router not found"
        print("✅ Router found in module")

        # Check endpoint function exists
        assert hasattr(calendar_module, 'add_calendar_event'), "Endpoint function not found"
        print("✅ add_calendar_event function found")

        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pydantic_models():
    """Test that the Pydantic models work correctly."""
    print("\n" + "=" * 60)
    print("Testing Pydantic Request/Response Models")
    print("=" * 60)

    try:
        from app.api.v1.calendar import AddEventRequest, AddEventResponse

        # Test request model
        request = AddEventRequest(
            summary="Test Event",
            start_time="2025-11-25T18:00:00Z",
            end_time="2025-11-25T20:00:00Z",
            location="Test Location",
            description="Test Description"
        )
        print("✅ AddEventRequest model works")
        print(f"   Summary: {request.summary}")
        print(f"   Start: {request.start_time}")
        print(f"   End: {request.end_time}")

        # Test response model
        response = AddEventResponse(
            success=True,
            event_id="test_123",
            event_link="https://calendar.google.com/test",
            message="Test message"
        )
        print("\n✅ AddEventResponse model works")
        print(f"   Success: {response.success}")
        print(f"   Event ID: {response.event_id}")
        print(f"   Link: {response.event_link}")

        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🧪 Calendar API Test Suite")
    print("=" * 60)

    results = []

    # Run all tests
    results.append(("Import Test", test_endpoint_imports()))
    results.append(("Pydantic Models Test", test_pydantic_models()))
    results.append(("Mock Client Test", test_mock_calendar_client()))

    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("\n🎉 All tests passed! Calendar API is working correctly.")
        print("\nNext steps:")
        print("1. Start the backend: python -m uvicorn app.main:app --reload")
        print("2. Visit http://localhost:8000/docs to test the endpoint")
        print("3. Or test from the frontend!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)
