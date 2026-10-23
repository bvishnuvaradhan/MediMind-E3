import os
import socket
import ssl
from urllib.parse import urlparse
import dns.resolver
from dotenv import load_dotenv

def test_tls():
    load_dotenv("backend/.env")
    uri = os.environ.get("MONGODB_URI")
    p = urlparse(uri.replace("mongodb+srv://", "http://"))
    cluster_host = p.hostname

    # Shard resolution
    srv = dns.resolver.resolve(f"_mongodb._tcp.{cluster_host}", "SRV")
    shards = [(str(r.target).rstrip("."), r.port) for r in srv]
    shard_host, port = shards[0]
    target_ip = socket.gethostbyname(shard_host)
    print(f"Target: {shard_host} ({target_ip}:{port})")

    # Test 1: Standard context (TLS 1.2 / 1.3 default)
    print("\n--- Test 1: Standard Default Context ---")
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((target_ip, port), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=shard_host) as ssock:
                print(f"Success! Version: {ssock.version()}, Cipher: {ssock.cipher()}")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

    # Test 2: Explicit TLS 1.2
    print("\n--- Test 2: Explicit TLS 1.2 ---")
    ctx_12 = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx_12.load_default_certs()
    ctx_12.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx_12.maximum_version = ssl.TLSVersion.TLSv1_2
    try:
        with socket.create_connection((target_ip, port), timeout=5) as sock:
            with ctx_12.wrap_socket(sock, server_hostname=shard_host) as ssock:
                print(f"Success! Version: {ssock.version()}, Cipher: {ssock.cipher()}")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

    # Test 3: Explicit TLS 1.3
    print("\n--- Test 3: Explicit TLS 1.3 ---")
    ctx_13 = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx_13.load_default_certs()
    ctx_13.minimum_version = ssl.TLSVersion.TLSv1_3
    ctx_13.maximum_version = ssl.TLSVersion.TLSv1_3
    try:
        with socket.create_connection((target_ip, port), timeout=5) as sock:
            with ctx_13.wrap_socket(sock, server_hostname=shard_host) as ssock:
                print(f"Success! Version: {ssock.version()}, Cipher: {ssock.cipher()}")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

    # Test 4: SNI with cluster hostname instead of shard hostname
    print("\n--- Test 4: SNI using cluster hostname ---")
    try:
        with socket.create_connection((target_ip, port), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=cluster_host) as ssock:
                print(f"Success! Version: {ssock.version()}, Cipher: {ssock.cipher()}")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

    # Test 5: certifi CA bundle if available
    print("\n--- Test 5: Using certifi CA bundle ---")
    try:
        import certifi
        ctx_certifi = ssl.create_default_context(cafile=certifi.where())
        with socket.create_connection((target_ip, port), timeout=5) as sock:
            with ctx_certifi.wrap_socket(sock, server_hostname=shard_host) as ssock:
                print(f"Success! Version: {ssock.version()}, Cipher: {ssock.cipher()}")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_tls()
