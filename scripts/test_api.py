import requests
import time
import sys
import os

BASE_URL = "http://localhost:8010/api/v1"
PROJECT_ID = 1

def run_test():
    print("--- CloudSentinel X Stabilization E2E Test ---")
    
    # 1. Upload sample config
    print("\n1. Uploading sample_logs_attack.json...")
    
    # Use absolute path for Windows robustness
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, "..", "datasets", "sample_logs_attack.json")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
        
    with open(file_path, "rb") as f:
        files = {"file": f}
        try:
            resp = requests.post(f"{BASE_URL}/uploads/{PROJECT_ID}", files=files)
            resp.raise_for_status()
            data = resp.json()
            scan_id = data["scan_id"]
            print(f"✅ Upload succeeded. Scan ID: {scan_id}")
        except Exception as e:
            print(f"❌ Upload failed: {e}")
            if 'resp' in locals():
                print(f"Response Details: {resp.text}")
            sys.exit(1)
            
    # 2. Poll Scan Status
    print("\n2. Polling Scan Status...")
    start_time = time.time()
    timeout = 30 # 30 seconds timeout
    
    while True:
        try:
            resp = requests.get(f"{BASE_URL}/scans/{scan_id}")
            resp.raise_for_status()
            scan_data = resp.json()
            status = scan_data["status"]
            print(f"   Status: {status}")
            
            if status == "COMPLETED":
                break
            if status == "FAILED":
                print(f"❌ Scan failed: {scan_data.get('error_message', 'No error message')}")
                sys.exit(1)
                
            if time.time() - start_time > timeout:
                print("❌ Polling timed out.")
                sys.exit(1)
                
            time.sleep(1)
        except Exception as e:
            print(f"❌ Polling failed: {e}")
            sys.exit(1)
            
    print("✅ Scan COMPLETED successfully.")
    
    # 3. Check Findings
    print("\n3. Checking Findings...")
    try:
        resp = requests.get(f"{BASE_URL}/findings/project/{PROJECT_ID}")
        resp.raise_for_status()
        findings = resp.json()
        print(f"   Total Findings: {len(findings)}")
        for f in findings:
            print(f"   - [{f['severity']}] {f['title']}")
    except Exception as e:
        print(f"❌ Error fetching findings: {e}")
        
    # 4. Check Scans History Route
    print("\n4. Checking Scans History...")
    try:
        resp = requests.get(f"{BASE_URL}/scans/project/{PROJECT_ID}")
        resp.raise_for_status()
        history = resp.json()
        print(f"✅ History returns array of {len(history)} items.")
    except Exception as e:
        print(f"❌ Error fetching scan history: {e}")

if __name__ == "__main__":
    run_test()
