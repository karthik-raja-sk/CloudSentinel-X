import requests
resp = requests.get("http://localhost:8000/api/v1/attack-paths/project/1")
data = resp.json()
print(f"Attack Paths Count: {len(data)}")
for path in data:
    print(f"- {path['title']}")
