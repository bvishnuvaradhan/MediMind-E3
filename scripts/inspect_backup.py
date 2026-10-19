import os
import sys
from datetime import datetime

target_path = r"D:\MediMind_Backups\MediMind_DB_Backup_20261009_000618"
parent_dir = r"D:\MediMind_Backups"

print(f"=== INSPECTING BACKUP TARGET: {target_path} ===")

if not os.path.exists(target_path):
    print("ERROR: Target path does not exist!")
    sys.exit(1)

canonical_path = os.path.realpath(target_path)
print(f"Canonical Path: {canonical_path}")

# Check if directory and check for symlink / reparse point
is_dir = os.path.isdir(target_path)
is_link = os.path.islink(target_path)
stat_info = os.lstat(target_path)
# On Windows, FILE_ATTRIBUTE_REPARSE_POINT is 0x400
is_reparse_point = bool(stat_info.st_file_attributes & 0x400) if hasattr(stat_info, 'st_file_attributes') else False

print(f"Is Directory: {is_dir}")
print(f"Is Symbolic Link: {is_link}")
print(f"Is Reparse Point: {is_reparse_point}")

created_time = datetime.fromtimestamp(stat_info.st_ctime)
modified_time = datetime.fromtimestamp(stat_info.st_mtime)
print(f"Directory Created Date: {created_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Directory Modified Date: {modified_time.strftime('%Y-%m-%d %H:%M:%S')}")

# Traverse target to count files, subdirectories, total size
total_size = 0
file_count = 0
dir_count = 0
top_level_items = os.listdir(target_path)
print(f"\nTop-level items inside target ({len(top_level_items)}): {top_level_items}")

database_names = []
for entry in top_level_items:
    ep = os.path.join(target_path, entry)
    if os.path.isdir(ep):
        database_names.append(entry)

for root, dirs, files in os.walk(target_path):
    dir_count += len(dirs)
    for f in files:
        file_count += 1
        fp = os.path.join(root, f)
        try:
            total_size += os.path.getsize(fp)
        except Exception:
            pass

size_mb = total_size / (1024 * 1024)
size_gb = total_size / (1024 * 1024 * 1024)

print(f"Total Size: {total_size} bytes ({size_mb:.2f} MB / {size_gb:.4f} GB)")
print(f"Total Subdirectories: {dir_count}")
print(f"Total Files: {file_count}")
print(f"Database Names represented: {database_names}")

# Check readability / completeness
unreadable = 0
for root, dirs, files in os.walk(target_path):
    for f in files:
        fp = os.path.join(root, f)
        try:
            with open(fp, 'rb') as test_f:
                _ = test_f.read(1024)
        except Exception as e:
            unreadable += 1

print(f"Unreadable files: {unreadable}")
print(f"Completeness & Readability check: {'PASSED (all files readable)' if unreadable == 0 else f'FAILED ({unreadable} unreadable)'}")

# Check other backup folders under D:\MediMind_Backups\
print(f"\n=== INSPECTING PARENT DIRECTORY: {parent_dir} ===")
all_backups = []
if os.path.exists(parent_dir):
    for item in os.listdir(parent_dir):
        item_path = os.path.join(parent_dir, item)
        if os.path.isdir(item_path):
            st = os.lstat(item_path)
            c_time = datetime.fromtimestamp(st.st_ctime)
            # Calculate folder size
            f_size = 0
            f_count = 0
            for r, d, fls in os.walk(item_path):
                for fl in fls:
                    f_count += 1
                    try:
                        f_size += os.path.getsize(os.path.join(r, fl))
                    except Exception:
                        pass
            all_backups.append({
                'name': item,
                'path': item_path,
                'created': c_time.strftime('%Y-%m-%d %H:%M:%S'),
                'size_mb': f_size / (1024 * 1024),
                'files': f_count
            })

for b in all_backups:
    print(f"Folder: {b['name']} | Created: {b['created']} | Size: {b['size_mb']:.2f} MB | Files: {b['files']}")
