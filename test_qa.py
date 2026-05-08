import urllib.request
import json

try:
    req = urllib.request.Request("http://localhost:8003/video/questions/video%201")
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
