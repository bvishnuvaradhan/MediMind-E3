#!/usr/bin/env python3
"""
PediURF Zip Downloader with Streaming Progress Tracking
Downloads PediURF.zip (2.17 GB) directly from Figshare CDN.
"""

import os
import sys
import time
import urllib.request
from pathlib import Path

def download_pediurf():
    target_dir = Path("d:/projects/MediMind/ai-prediction-service/test-dataset/Bone Facture/PediURF")
    target_dir.mkdir(parents=True, exist_ok=True)
    zip_path = target_dir / "PediURF.zip"

    url = "https://ndownloader.figshare.com/files/57469948"
    headers = {"User-Agent": "Mozilla/5.0"}
    req = urllib.request.Request(url, headers=headers)

    print(f"Downloading PediURF.zip from {url} to {zip_path}...")
    start_time = time.time()
    
    # Check if partially downloaded or already exists
    initial_size = zip_path.stat().st_size if zip_path.exists() else 0

    with urllib.request.urlopen(req) as resp, open(zip_path, "wb") as out_file:
        total_size = int(resp.headers.get("content-length", 0))
        print(f"Total Content Length: {total_size / (1024*1024):.2f} MB")
        
        downloaded = 0
        chunk_size = 1024 * 1024 * 4 # 4MB chunks
        last_log = time.time()

        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out_file.write(chunk)
            downloaded += len(chunk)

            if time.time() - last_log > 5.0 or downloaded == total_size:
                elapsed = time.time() - start_time
                speed_mb = (downloaded / (1024*1024)) / max(0.1, elapsed)
                pct = (downloaded / total_size) * 100 if total_size > 0 else 0
                print(f"Downloaded: {downloaded / (1024*1024):.1f} / {total_size / (1024*1024):.1f} MB ({pct:.1f}%) | Speed: {speed_mb:.2f} MB/s | Elapsed: {elapsed:.1f}s")
                last_log = time.time()

    elapsed = time.time() - start_time
    print(f"Download complete! Saved {zip_path.stat().st_size / (1024*1024):.2f} MB in {elapsed:.1f}s.")

if __name__ == "__main__":
    download_pediurf()
