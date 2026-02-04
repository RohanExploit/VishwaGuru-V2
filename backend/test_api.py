import requests

# Test the health endpoint
print("Testing health endpoint...")
response = requests.get("http://127.0.0.1:8002/health")
print(f"Health: {response.status_code}, {response.json()}")

# Test the pothole detection endpoint with a dummy request
print("\nTesting pothole detection endpoint...")
# Since we don't have an actual image file, we'll just check if the endpoint exists
try:
    # Create a simple dummy image for testing
    from PIL import Image
    import io

    # Create a dummy image
    img = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)

    # Send the request
    files = {'image': ('test.jpg', img_buffer, 'image/jpeg')}
    response = requests.post(
        "http://127.0.0.1:8002/api/detect-pothole", files=files)
    print(f"Pothole Detection: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error testing pothole detection: {e}")

# Test the chat endpoint
print("\nTesting chat endpoint...")
try:
    response = requests.post("http://127.0.0.1:8002/api/chat",
                             json={"query": "Hello, how are you?"},
                             headers={"Content-Type": "application/json"})
    print(f"Chat: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error testing chat: {e}")

# Test the responsibility map endpoint
print("\nTesting responsibility map endpoint...")
try:
    response = requests.get("http://127.0.0.1:8002/api/responsibility-map")
    print(f"Responsibility Map: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        # Show first 3 keys
        print(f"Response keys: {list(data.keys())[:3]}...")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error testing responsibility map: {e}")

print("\nAll tests completed!")
