import os
import sys
import json
import requests
from datetime import datetime

# Configuration from environment
BASE_URL = os.environ.get("TESLA_STATS_BASE_URL", "http://localhost:8080/api/v1")
API_KEY = os.environ.get("TESLA_STATS_API_KEY")
X_API_KEY = os.environ.get("TESLA_X_API_KEY")

def call_api(path, method="GET", params=None, data=None, files=None):
    headers = {}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
        # Also try X-API-Key as a fallback/alternative since YAML mentions both
        headers["X-API-Key"] = API_KEY
    if X_API_KEY:
        headers["X-API-Key"] = X_API_KEY
    
    url = f"{BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    
    try:
        if files:
            # For multipart/form-data, requests handles headers automatically
            response = requests.request(method, url, headers=headers, params=params, files=files, timeout=30)
        else:
            response = requests.request(method, url, headers=headers, params=params, json=data, timeout=15)
            
        response.raise_for_status()
        # Handle non-JSON responses (like background-image which might be binary/base64)
        if "application/json" in response.headers.get("Content-Type", ""):
            return response.json()
        else:
            return {"status": "success", "content_type": response.headers.get("Content-Type"), "text": response.text[:100] + "..."}
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}", file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 tesla_api.py <endpoint_name> [params_json]")
        sys.exit(1)

    endpoint = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    # Endpoint mapping
    if endpoint == "get_cars":
        print(json.dumps(call_api("/cars")))

    elif endpoint == "get_car_status":
        path = f"/cars/{args['id']}/status"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_soc_history":
        path = f"/cars/{args['id']}/stats/soc-history"
        params = {k: v for k, v in args.items() if k in ['from', 'to', 'hours']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_states_timeline":
        path = f"/cars/{args['id']}/stats/states-timeline"
        params = {k: v for k, v in args.items() if k in ['from', 'to', 'hours']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_settings":
        print(json.dumps(call_api("/settings")))

    elif endpoint == "update_setting":
        # POST /settings {key, value}
        print(json.dumps(call_api("/settings", method="POST", data=args)))

    elif endpoint == "batch_update_settings":
        # PUT /settings {key: value, ...}
        print(json.dumps(call_api("/settings", method="PUT", data=args)))

    elif endpoint == "get_background_image":
        print(json.dumps(call_api("/background-image")))

    elif endpoint == "upload_background_image":
        file_path = args.get('file_path')
        if not file_path:
            print("Error: file_path required for upload", file=sys.stderr)
            sys.exit(1)
        with open(file_path, 'rb') as f:
            print(json.dumps(call_api("/background-image", method="POST", files={'image': f})))

    elif endpoint == "delete_background_image":
        print(json.dumps(call_api("/background-image", method="DELETE")))

    elif endpoint == "get_background_hash":
        print(json.dumps(call_api("/background-image/hash")))

    elif endpoint == "test_auth":
        print(json.dumps(call_api("/auth/test")))

    elif endpoint == "get_charges":
        path = f"/cars/{args['id']}/charges"
        params = {k: v for k, v in args.items() if k in ['page', 'pageSize', 'startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_charge_detail":
        path = f"/charges/{args['id']}"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_charge_stats":
        path = f"/charges/{args['id']}/stats"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_charge_stats_summary":
        path = f"/cars/{args['id']}/charges/stats_summary"
        params = {k: v for k, v in args.items() if k in ['startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_drives":
        path = f"/cars/{args['id']}/drives"
        params = {k: v for k, v in args.items() if k in ['page', 'pageSize', 'startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_drive_stats_summary":
        path = f"/cars/{args['id']}/drives/stats_summary"
        params = {k: v for k, v in args.items() if k in ['startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))
        
    elif endpoint == "get_speed_histogram":
        path = f"/cars/{args['id']}/drives/speed_histogram"
        params = {k: v for k, v in args.items() if k in ['startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_positions":
        path = f"/cars/{args['id']}/drives/positions"
        params = {k: v for k, v in args.items() if k in ['startDate', 'endDate']}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_drive_detail":
        path = f"/drives/{args['id']}"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_drive_positions":
        path = f"/drives/{args['id']}/positions"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_drive_speed_histogram":
        path = f"/drives/{args['id']}/speed_histogram"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_stats_overview":
        path = f"/cars/{args['id']}/stats/overview"
        print(json.dumps(call_api(path)))

    elif endpoint == "get_efficiency_stats":
        path = f"/cars/{args['id']}/stats/efficiency"
        params = {'days': args.get('days', 30)}
        print(json.dumps(call_api(path, params=params)))

    elif endpoint == "get_battery_degradation":
        path = f"/cars/{args['id']}/stats/battery"
        print(json.dumps(call_api(path)))

    else:
        print(f"Unknown endpoint: {endpoint}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
