with open('frontend/src/data/medimindData.js', 'r', encoding='utf-8') as f:
    text = f.read()

for line in text.splitlines():
    if 'initialDoctors' in line or 'doctors' in line.lower() and ('export' in line or 'const' in line or 'let' in line):
        print(line[:120])
