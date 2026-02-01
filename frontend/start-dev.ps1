# This script is for local development and testing.
# It starts the frontend development server.

# Get the script's directory and change the current location to it.
Push-Location (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

# Check if node_modules exists, if not run npm install
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running 'npm install'..."
    npm install
}

# Start the frontend development server.
Write-Host "Starting frontend development server..."
npm run dev --host

# Return to the original directory.
Pop-Location
