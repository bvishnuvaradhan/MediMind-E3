import os
import subprocess
import time
from dotenv import load_dotenv

def backup_atlas():
    load_dotenv("backend/.env")
    uri = os.environ.get("MONGODB_URI")
    dump_bin = r"C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-database-tools-windows-x86_64-100.9.0\bin\mongodump.exe"
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    out_dir = rf"D:\MediMind_Backups\Atlas_Backup_{timestamp}"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Starting mongodump of Atlas cluster to {out_dir}...")
    cmd = [dump_bin, f"--uri={uri}", f"--out={out_dir}", "--gzip"]
    proc = subprocess.run(cmd, capture_output=True, text=True)

    if proc.returncode == 0:
        print(f"Backup SUCCESSFUL to {out_dir}")
        for root, dirs, files in os.walk(out_dir):
            for file in files:
                p = os.path.join(root, file)
                sz = os.path.getsize(p)
                print(f"  - {os.path.relpath(p, out_dir)} ({sz} bytes)")
    else:
        print(f"Backup FAILED: {proc.stderr}")

if __name__ == "__main__":
    backup_atlas()
