import openpyxl
import json

wb = openpyxl.load_workbook('Documents/MediMind_Role_Credentials.xlsx')
sheets = ['Chairman', 'Hospital Admin', 'Department Head', 'Doctor', 'Family']
inventory = []

for sheet_name in sheets:
    sheet = wb[sheet_name]
    header = [c.value for c in sheet[1]]
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not any(row):
            continue
        r = dict(zip(header, row))
        email = (r.get('Email / Username') or '').strip().lower()
        name = (r.get('Full Name') or '').strip()
        role = (r.get('Role') or sheet_name).upper().replace(' ', '_')
        acc_id = r.get('Account ID')
        
        entry = {
            'account_id': acc_id,
            'role': role,
            'full_name': name,
            'email': email,
            'hospital': r.get('Hospital Name'),
            'department': r.get('Department Name'),
            'specialization': r.get('Specialization'),
            'family_code': r.get('Family Code'),
            'doctor_code': r.get('Doctor Code'),
            'member_count': r.get('Member Count')
        }
        inventory.append(entry)

with open('scripts/canonical_inventory.json', 'w', encoding='utf-8') as f:
    json.dump(inventory, f, indent=2)

print(f"Generated canonical inventory for {len(inventory)} accounts.")
by_role = {}
for item in inventory:
    by_role[item['role']] = by_role.get(item['role'], 0) + 1
print("Counts by role:", by_role)
