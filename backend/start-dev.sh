#!/bin/bash

# This script is for local development and testing.
# It reads variables from the root .env file and sets them as environment variables.

# Get the script's directory and change the current location to it.
cd "$(dirname "$0")" || exit

# Define the path to the .env file in the root directory.
ENV_PATH="../.env"

if [ -f "$ENV_PATH" ]; then
    echo "Loading environment variables from .env file..."
    # Read .env file and set each variable
    while IFS='=' read -r key value; do
        # Ignore comments and empty lines
        if [[ -n "$key" && ! "$key" =~ ^# ]]; then
            # Remove trailing and leading spaces
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | tr -d '\r' | xargs)
            export "$key=$value"
            echo " - Set $key = '$value'"
        fi
    done < "$ENV_PATH"
    echo "Environment variables set successfully."
    echo ""
else
    echo "Warning: .env file not found at $ENV_PATH. Using default configuration from code."
    echo ""
fi

# Parse arguments for mock mode
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --mock) MOCK=true; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
done

if [ "$MOCK" = true ]; then
    echo -e "\033[33mEnabling Mock Data Mode...\033[0m"
    export CYBERUI_MOCK_DATA="true"
fi

# Run the backend server.
echo "Starting backend server..."
go run ./cmd/server/main.go
