# This script is for local development and testing.
# It reads variables from the root .env file and sets them as environment variables.

# Get the script's directory and change the current location to it.
Push-Location (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

# Define the path to the .env file in the root directory.
$envPath = "..\.env"

if (Test-Path $envPath) {
    Write-Host "Loading environment variables from .env file..."
    
    # Read .env file and set each variable
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                Set-Item -Path "env:$key" -Value $value
                Write-Host " - Set env:$key = '$value'"
            }
        }
    }
    
    Write-Host "Environment variables set successfully.`n"
} else {
    Write-Host "Warning: .env file not found at $envPath. Using default configuration from code.`n"
}

# Run the backend server.
Write-Host "Starting backend server..."
go run ./cmd/server/main.go

# Return to the original directory.
Pop-Location
