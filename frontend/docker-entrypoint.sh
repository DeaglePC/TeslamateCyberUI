#!/bin/sh
# ============================================
# Docker Entrypoint Script
# Injects Umami analytics script into index.html
# based on environment variables at container startup
# ============================================

INDEX_FILE="/usr/share/nginx/html/index.html"
PLACEHOLDER="<!-- UMAMI_SCRIPT_PLACEHOLDER -->"

if [ -n "$UMAMI_WEBSITE_ID" ]; then
    # Use default Umami Cloud script URL if not specified
    SCRIPT_URL="${UMAMI_SCRIPT_URL:-https://cloud.umami.is/script.js}"

    # Build the script tag
    UMAMI_TAG="<script defer src=\"${SCRIPT_URL}\" data-website-id=\"${UMAMI_WEBSITE_ID}\"></script>"

    echo "Umami analytics enabled: website_id=${UMAMI_WEBSITE_ID}, script_url=${SCRIPT_URL}"

    # Replace placeholder with actual script tag
    sed -i "s|${PLACEHOLDER}|${UMAMI_TAG}|g" "$INDEX_FILE"
else
    echo "Umami analytics disabled (UMAMI_WEBSITE_ID not set)"

    # Remove placeholder to keep HTML clean
    sed -i "s|${PLACEHOLDER}||g" "$INDEX_FILE"
fi

# Start Nginx
exec nginx -g "daemon off;"
