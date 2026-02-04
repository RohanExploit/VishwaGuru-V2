import requests

# Test the health endpoint
print("Testing health endpoint...")
response = requests.get("http://127.0.0.1:8002/health")
print(f"Health: {response.status_code}, {response.json()}")

# Test the root endpoint
print("\nTesting root endpoint...")
response = requests.get("http://127.0.0.1:8002/")
print(f"Root: {response.status_code}, {response.json()}")

# Test the responsibility map endpoint
print("\nTesting responsibility map endpoint...")
try:
    response = requests.get("http://127.0.0.1:8002/api/responsibility-map")
    print(f"Responsibility Map: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(
            f"Response loaded, keys count: {len(data.keys()) if isinstance(data, dict) else 'N/A'}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error testing responsibility map: {e}")

# Test the chat endpoint
print("\nTesting chat endpoint...")
try:
    response = requests.post("http://127.0.0.1:8002/api/chat",
                             json={"query": "Hello"},
                             headers={"Content-Type": "application/json"})
    print(f"Chat: {response.status_code}")
    if response.status_code == 200:
        print(f"Response received successfully")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error testing chat: {e}")

print("\nBasic tests completed!")
