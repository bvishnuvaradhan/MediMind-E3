"""
MediMind Atlas Connection & TLS Diagnostic Tool
Analyzes DNS resolution, TCP connectivity, TLS handshake, and driver response
without logging credentials or modifying any configuration.
"""

import os
import socket
import ssl
import sys
from urllib.parse import urlparse
import dns.resolver
from dotenv import load_dotenv

def get_masked_uri(raw_uri: str) -> str:
    if not raw_uri:
        return "<EMPTY>"
    try:
        clean = raw_uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")
        p = urlparse(clean)
        proto = "mongodb+srv://" if raw_uri.startswith("mongodb+srv://") else "mongodb://"
        return f"{proto}***:***@{p.hostname}"
    except Exception:
        return "mongodb+srv://***@<hostname>"

def run_diagnostics():
    env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if not os.path.exists(env_path):
        print(f"Error: {env_path} does not exist")
        return

    load_dotenv(env_path)
    raw_uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI")

    if not raw_uri:
        print("Error: No MONGODB_URI found in backend/.env")
        return

    print(f"[*] Target URI configured: {get_masked_uri(raw_uri)}")
    is_srv = raw_uri.startswith("mongodb+srv://")
    print(f"[*] URI Scheme: {'mongodb+srv (Atlas Replica Set)' if is_srv else 'Standard'}")

    clean = raw_uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")
    parsed = urlparse(clean)
    cluster_host = parsed.hostname
    print(f"[*] Target Cluster Host: {cluster_host}")

    shards = []
    if is_srv:
        srv_name = f"_mongodb._tcp.{cluster_host}"
        print(f"[*] Resolving SRV record: {srv_name} ...")
        try:
            answers = dns.resolver.resolve(srv_name, "SRV")
            for rdata in answers:
                shard_host = str(rdata.target).rstrip(".")
                port = rdata.port
                shards.append((shard_host, port))
                print(f"    - Found shard: {shard_host}:{port} (priority={rdata.priority}, weight={rdata.weight})")
        except Exception as e:
            print(f"[!] SRV Resolution failed: {e}")
            return
    else:
        shards.append((cluster_host, parsed.port or 27017))

    # Diagnose each shard
    for shard_host, port in shards:
        print(f"\n--- Diagnosing Shard: {shard_host}:{port} ---")
        
        # 1. DNS Resolution (A records)
        try:
            ip_answers = socket.gethostbyname_ex(shard_host)
            canonical, aliases, ip_list = ip_answers
            print(f"[*] DNS A records: {ip_list} (Canonical: {canonical})")
        except Exception as e:
            print(f"[!] DNS A lookup failed: {e}")
            continue

        target_ip = ip_list[0] if ip_list else shard_host

        # 2. Raw TCP Socket
        print(f"[*] Attempting raw TCP socket connection to {target_ip}:{port} (timeout 5s)...")
        tcp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_sock.settimeout(5.0)
        try:
            tcp_sock.connect((target_ip, port))
            print(f"[+] TCP connection established successfully to {target_ip}:{port}")
        except Exception as e:
            print(f"[!] TCP connection failed: {e}")
            tcp_sock.close()
            continue

        # 3. TLS Handshake with standard system CA trust store
        print(f"[*] Initiating TLS handshake with SNI server_hostname='{shard_host}'...")
        ssl_ctx = ssl.create_default_context()
        # Verify TLS verification is enabled
        print(f"[*] TLS Verify Mode: {ssl_ctx.verify_mode} (CERT_REQUIRED={ssl.CERT_REQUIRED})")
        print(f"[*] TLS Check Hostname: {ssl_ctx.check_hostname}")
        
        try:
            ssl_sock = ssl_ctx.wrap_socket(tcp_sock, server_hostname=shard_host)
            print(f"[+] TLS handshake SUCCESSFUL!")
            print(f"    - Cipher: {ssl_sock.cipher()}")
            print(f"    - Protocol version: {ssl_sock.version()}")
            cert = ssl_sock.getpeercert()
            print(f"    - Peer subject: {cert.get('subject')}")
            print(f"    - Peer issuer: {cert.get('issuer')}")
            ssl_sock.close()
        except ssl.SSLError as ssl_err:
            print(f"[!] TLS Handshake Failed with SSLError:")
            print(f"    - Reason: {ssl_err.reason}")
            print(f"    - Error code / strerror: {ssl_err}")
            print(f"    - Subclass: {type(ssl_err).__name__}")
        except Exception as e:
            print(f"[!] Unexpected error during TLS handshake: {type(e).__name__}: {e}")
        finally:
            try:
                tcp_sock.close()
            except Exception:
                pass

    # 4. Driver Connection Test (PyMongo)
    print("\n--- Testing via PyMongo official driver ---")
    import pymongo
    from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
    try:
        client = pymongo.MongoClient(raw_uri, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000)
        # Attempt read-only server info
        print("[*] Calling client.server_info() ...")
        info = client.server_info()
        print(f"[+] Successfully connected to MongoDB Atlas! MongoDB version: {info.get('version')}")
        dbs = client.list_database_names()
        print(f"[+] Accessible databases: {dbs}")
    except ServerSelectionTimeoutError as sste:
        print(f"[!] PyMongo ServerSelectionTimeoutError: {sste}")
    except ConnectionFailure as cf:
        print(f"[!] PyMongo ConnectionFailure: {cf}")
    except Exception as e:
        print(f"[!] PyMongo Unexpected Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    run_diagnostics()
