#!/bin/bash

# Find and kill the process running on port 8000
PID=$(lsof -t -i:8000)
if [ -n "$PID" ]; then
  echo "Found process on port 8000 with PID: $PID. Killing it."
  kill -9 $PID
  # Wait a moment for the port to be released
  sleep 1
fi

source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000