import subprocess
import json
import re

with open('frontend/src/data/medimindData.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's see doctors in medimindData.js
doc_section = re.search(r'export const doctors = \[(.*?)\];', text, re.DOTALL)
if doc_section:
    block = doc_section.group(1)
    doc_ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", block)
    print("Doctors in current medimindData.js:", len(doc_ids))
    print("Doctor IDs:", doc_ids)

# Let's check git history before our patch (commit a079b5b or eefe993)
for c in ['eefe993', 'a079b5b', '14e2be2']:
    try:
        old_text = subprocess.check_output(['git', 'show', f'{c}:frontend/src/data/medimindData.js'], encoding='utf-8')
        old_section = re.search(r'export const doctors = \[(.*?)\];', old_text, re.DOTALL)
        if old_section:
            old_block = old_section.group(1)
            old_ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", old_block)
            print(f"Doctors in commit {c}: {len(old_ids)}")
            if len(old_ids) > 0 and len(old_ids) <= 20:
                print(f"  Sample {c} IDs: {old_ids[:5]}")
    except Exception as e:
        print(f"Error checking {c}: {e}")

# Check Documents for 66 doctors
import glob
print("\n--- SEARCHING DOCUMENTS FOR 66 OR DOCTOR COUNTS ---")
for doc_file in glob.glob('Documents/**/*.txt', recursive=True) + glob.glob('Documents/**/*.md', recursive=True):
    try:
        with open(doc_file, 'r', encoding='utf-8') as fh:
            d_text = fh.read()
            if '66' in d_text:
                print(f"Match for '66' in {doc_file}:")
                for line in d_text.splitlines():
                    if '66' in line:
                        print(f"  {line[:120]}")
    except Exception:
        pass
