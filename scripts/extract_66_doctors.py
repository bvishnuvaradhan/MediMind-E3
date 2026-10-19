import subprocess
import json
import re

old_text = subprocess.check_output(['git', 'show', 'a079b5b:frontend/src/data/medimindData.js'], encoding='utf-8')
# Find the doctors array
doc_section = re.search(r'export const doctors = \[(.*?)\];\s*// =+', old_text, re.DOTALL)
if doc_section:
    block = doc_section.group(1)
    # Parse individual doctor objects
    # Let's count how many objects by splitting on { and } or id:
    doc_matches = re.findall(r"\{\s*id:\s*['\"]([^'\"]+)['\"].*?name:\s*['\"]([^'\"]+)['\"].*?hospitalId:\s*['\"]([^'\"]+)['\"].*?departmentId:\s*['\"]([^'\"]+)['\"].*?status:\s*['\"]([^'\"]+)['\"]", block, re.DOTALL)
    print(f"Parsed doctors from commit a079b5b: {len(doc_matches)}")
    for d in doc_matches[:10]:
        print(d)

    # Let's dump all 66 doctors into a json file for inspection
    # Use python's node or regex to parse the array cleanly
    # Let's write a node script to require or parse it
