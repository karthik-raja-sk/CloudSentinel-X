import requests
import json
import time

base = 'http://localhost:8010/api/v1'

print("Starting verification protocol...")

# 1. Verification of the upload endpoint
try:
    print('1. Uploading sample config...')
    with open('../datasets/sample_config.json', 'r') as f:
        r = requests.post(f'{base}/uploads/1', files={'file': f})
        print(f"   Upload Status: {r.status_code}")
except Exception as e:
    print(f"Upload failed: {e}")

time.sleep(2) # Give background task a moment

# 2. Schema mapping
try:
    print('\n2. Fetching recent findings...')
    r2 = requests.get(f'{base}/findings/project/1')
    findings = r2.json()
    print('3. Verification of new schemas against misconfigurations:')
    for f in findings[-3:]:
        # It's an array of finding objects, so we safely resolve keys
        title = f.get('title', 'Unknown')
        rec = f.get('recommendation_type', 'None')
        print(f"   {title} -> {rec}")
except Exception as e:
     print(f"Failed to fetch findings: {e}")

# 3. Redaction workflow
try:
    print('\n4. Executing Redaction Preview Endpoint:')
    res = requests.post(f'{base}/redaction/preview', json={'raw_value': 'shawn@company.com', 'data_type': 'EMAIL'})
    print(f"   Preview Request Status: {res.status_code}")
    print(f"   Preview Result Schema: {list(res.json().keys())}")
    print(f"   Preview masked output: {res.json().get('masked_snippet')}")
except Exception as e:
    print(f"Redaction API failure: {e}")

# 4. Analytics mapping
try:
    print('\n5. Validating Dashboard Analytics Map:')
    analytics = requests.get(f'{base}/analytics/summary/1').json()
    print(f"   Total Misconfigs: {analytics.get('cloud_misconfig_count')}")
    print(f"   Total Needs Remediation: {analytics.get('findings_needing_remediation')}")
except Exception as e:
    print(f"Analytics endpoint failure: {e}")
