import json
import re

with open('frontend/src/data/medimindData.js', 'r', encoding='utf-8') as f:
    content = f.read()

doc_matches = re.findall(r'id:\s*[\'"`](doc_\d+)[\'"`]', content)
print(f"Total doctor objects in medimindData.js: {len(doc_matches)}")
if doc_matches:
    print(f"First 5: {doc_matches[:5]}")
    print(f"Last 5: {doc_matches[-5:]}")
