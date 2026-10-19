import json

with open('scripts/canonical_frontend_data.json', 'r', encoding='utf-8') as f:
    canon = json.load(f)

with open('frontend/src/data/medimindData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Helper to replace array content
def replace_array(content, array_name, new_data):
    marker = f"export const {array_name} = ["
    start_pos = content.find(marker)
    if start_pos == -1:
        raise ValueError(f"Marker {marker} not found")
    
    # Find matching closing bracket
    bracket_count = 0
    end_pos = -1
    for i in range(start_pos + len(marker) - 1, len(content)):
        if content[i] == '[':
            bracket_count += 1
        elif content[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end_pos = i + 1
                break
                
    if end_pos == -1:
        raise ValueError(f"Closing bracket for {array_name} not found")
        
    js_code = f"export const {array_name} = " + json.dumps(new_data, indent=2)
    return content[:start_pos] + js_code + content[end_pos:]

# Replace chairmen
content = replace_array(content, 'chairmen', canon['chairmen'])
# Replace hospitalAdmins
content = replace_array(content, 'hospitalAdmins', canon['hospitalAdmins'])
# Replace departmentHeads
content = replace_array(content, 'departmentHeads', canon['departmentHeads'])
# Replace doctors
content = replace_array(content, 'doctors', canon['doctors'])
# Replace families
content = replace_array(content, 'families', canon['families'])
# Replace familyMembers
content = replace_array(content, 'familyMembers', canon['familyMembers'])

with open('frontend/src/data/medimindData.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated medimindData.js with all canonical accounts!")
