#!/bin/bash

cd /home/runner/workspace

echo "Starting Vite dev server on port 5173..."
npx vite --port 5173 &
VITE_PID=$!

sleep 2

echo "Starting Python FastAPI server on port 5000..."
cd python_backend
python main.py &
PYTHON_PID=$!

trap "kill $VITE_PID $PYTHON_PID 2>/dev/null" EXIT

wait
