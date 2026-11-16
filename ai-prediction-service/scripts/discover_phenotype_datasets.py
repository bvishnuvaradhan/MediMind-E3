import urllib.request
import urllib.parse
import json
import io
import pandas as pd

queries = [
    'gestational diabetes csv',
    'type 1 diabetes csv',
    'prediabetes csv',
    'mody diabetes'
]

for q in queries:
    url = f'https://api.github.com/search/repositories?q={urllib.parse.quote(q)}&sort=stars&order=desc&per_page=5'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"\n=== Query: {q} (Total matches: {data.get('total_count', 0)}) ===")
            for item in data.get('items', [])[:4]:
                name = item['full_name']
                stars = item['stargazers_count']
                desc = (item['description'] or '')[:100]
                print(f"  * {name} (Stars: {stars}) - {desc}")
    except Exception as e:
        print(f"Error on {q}: {e}")
