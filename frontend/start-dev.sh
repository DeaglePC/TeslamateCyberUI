#!/bin/bash

# This script is for starting the frontend development server.

# Get the script's directory and change the current location to it.
cd "$(dirname "$0")" || exit

# Parse arguments for mock mode
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --mock) MOCK=true; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
done

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running 'npm install'..."
    npm install
fi

if [ "$MOCK" = true ]; then
    echo -e "\033[33mStarting frontend server in Mock Data context (ensure backend was also started with --mock)...\033[0m"
fi

echo "Starting frontend development server..."
npm run dev -- --host
