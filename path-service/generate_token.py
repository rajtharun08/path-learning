import jwt
print(jwt.encode({"role": "admin"}, "your-local-secret", algorithm="HS256"))