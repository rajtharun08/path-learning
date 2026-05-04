import base64
import hashlib
import hmac
import secrets


PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return (
        f"{PBKDF2_ITERATIONS}$"
        f"{base64.b64encode(salt).decode('utf-8')}$"
        f"{base64.b64encode(digest).decode('utf-8')}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        iterations_text, salt_b64, digest_b64 = stored_hash.split("$", 2)
        iterations = int(iterations_text)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected_digest = base64.b64decode(digest_b64.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)
