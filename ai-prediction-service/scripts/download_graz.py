import os
import sys
import time
import zipfile
import urllib.request

FILES = [
    ("images_part1.zip", "https://ndownloader.figshare.com/files/34268828", 4046496654),
    ("images_part2.zip", "https://ndownloader.figshare.com/files/34268849", 4122340570),
    ("images_part3.zip", "https://ndownloader.figshare.com/files/34268864", 3851087522),
    ("images_part4.zip", "https://ndownloader.figshare.com/files/34268891", 4207641269),
]

def download_file(filename, url, expected_size, target_dir):
    filepath = os.path.join(target_dir, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) >= expected_size:
        print(f"[Skip] {filename} already fully downloaded.")
        return filepath

    print(f"[Downloading] {filename} ({expected_size / 1024 / 1024:.1f} MB)...")
    t0 = time.time()
    
    # Download with buffer
    with urllib.request.urlopen(url) as response, open(filepath, 'wb') as out_file:
        downloaded = 0
        chunk_size = 1024 * 1024 # 1MB
        last_log = time.time()
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            out_file.write(chunk)
            downloaded += len(chunk)
            if time.time() - last_log > 5:
                mb_s = (downloaded / 1024 / 1024) / (time.time() - t0 + 1e-5)
                pct = (downloaded / expected_size) * 100
                print(f"  -> {filename}: {downloaded/1024/1024:.1f}/{expected_size/1024/1024:.1f} MB ({pct:.1f}%) @ {mb_s:.2f} MB/s", flush=True)
                last_log = time.time()

    print(f"[Done] {filename} in {time.time() - t0:.1f}s", flush=True)
    return filepath

def extract_zip(filepath, target_dir):
    print(f"[Extracting] {filepath}...", flush=True)
    t0 = time.time()
    with zipfile.ZipFile(filepath, 'r') as z:
        z.extractall(target_dir)
    print(f"[Extracted] {filepath} in {time.time() - t0:.1f}s", flush=True)

if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\GRAZPEDWRI-DX"
    os.makedirs(target_dir, exist_ok=True)
    
    # Download parts
    parts_to_get = sys.argv[2:] if len(sys.argv) > 2 else ["1"] # Default to part 1 or all
    for idx, (fname, url, exp_size) in enumerate(FILES, start=1):
        if str(idx) in parts_to_get or "all" in parts_to_get:
            zip_path = download_file(fname, url, exp_size, target_dir)
            extract_zip(zip_path, target_dir)
