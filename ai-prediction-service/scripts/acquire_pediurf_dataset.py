#!/usr/bin/env python3
"""
PediURF Dataset Acquisition & Verification Script
Queries Figshare API / direct repository for PediURF (DOI: 10.6084/m9.figshare.29998954)
and downloads / structures the external evaluation dataset.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path

def inspect_and_download_pediurf():
    repo_root = Path("d:/projects/MediMind")
    service_root = repo_root / "ai-prediction-service"
    target_dir = service_root / "test-dataset" / "Bone Facture" / "PediURF"
    target_dir.mkdir(parents=True, exist_ok=True)

    headers = {"User-Agent": "Mozilla/5.0"}
    
    # Try Figshare article endpoint
    article_id = "29998954"
    url = f"https://api.figshare.com/v2/articles/{article_id}"
    req = urllib.request.Request(url, headers=headers)
    
    print(f"Connecting to Figshare API: {url}...")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            print(f"Dataset Title: {data.get('title')}")
            print(f"DOI: {data.get('doi')}")
            print(f"Published Date: {data.get('published_date')}")
            print(f"Total files in Figshare deposit: {len(data.get('files', []))}")
            for f in data.get("files", []):
                name = f.get("name")
                size_mb = f.get("size", 0) / (1024 * 1024)
                dl_url = f.get("download_url")
                print(f" - {name} ({size_mb:.2f} MB): {dl_url}")
            return data
    except Exception as e:
        print(f"Figshare API query error: {e}")
        
    # Also search Figshare for PediURF or Pediatric Ulna and Radius Fractures
    search_url = "https://api.figshare.com/v2/articles/search"
    query = {"search_for": "PediURF Pediatric Ulna Radius", "page_size": 5}
    req2 = urllib.request.Request(search_url, data=json.dumps(query).encode(), headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            results = json.loads(resp2.read().decode())
            print(f"\nSearch results count: {len(results)}")
            for r in results:
                print(f"ID: {r.get('id')} | Title: {r.get('title')} | DOI: {r.get('doi')}")
    except Exception as e2:
        print(f"Search API error: {e2}")

if __name__ == "__main__":
    inspect_and_download_pediurf()
