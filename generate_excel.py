import pandas as pd
from pymongo import MongoClient

def main():
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["medimind_auth"]
    collection = db["users"]

    users = list(collection.find({}))
    print(f"Found {len(users)} users in medimind_auth.users")

    data = []
    for u in users:
        # Map fields
        role = u.get("role", "")
        # Get Name (not in auth DB typically, maybe display name is somewhere else? 
        # Wait, the prompt says "Role, Full Name, Email / Login ID, Password, User ID, Reference ID, Family ID, Doctor ID, Department ID, Hospital ID, Account Status"
        # Let's check what fields the auth DB has.
        name = u.get("full_name") or u.get("name") or u.get("display_name") or ""
        email = u.get("email", "")
        password = "Password123!"  # Seed password
        user_id = str(u.get("_id", ""))
        ref_id = str(u.get("reference_id", ""))
        family_id = u.get("family_id", "")
        doctor_id = u.get("doctor_id", "")
        department_id = u.get("department_id", "")
        hospital_id = u.get("hospital_id", "")
        status = u.get("status", "")

        data.append({
            "Role": role,
            "Name": name,
            "Email": email,
            "Password": password,
            "User ID": user_id,
            "Reference ID": ref_id,
            "Family ID": family_id,
            "Doctor ID": doctor_id,
            "Department ID": department_id,
            "Hospital ID": hospital_id,
            "Status": status
        })

    df = pd.DataFrame(data)

    with pd.ExcelWriter("MediMind_All_Login_Accounts.xlsx", engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="All Accounts", index=False)
        
        # Write specific sheets
        roles = {
            "Chairman": "CHAIRMAN",
            "Hospital Admin": "HOSPITAL_ADMIN",
            "Department Head": "DEPARTMENT_HEAD",
            "Doctor": "DOCTOR",
            "Family": "FAMILY"
        }
        
        counts = []
        
        for sheet_name, role_val in roles.items():
            role_df = df[df["Role"] == role_val]
            role_df.to_excel(writer, sheet_name=sheet_name, index=False)
            counts.append({"Role": sheet_name, "Account Count": len(role_df)})
        
        counts.append({"Role": "Total Accounts", "Account Count": len(df)})
        summary_df = pd.DataFrame(counts)
        summary_df.to_excel(writer, sheet_name="Summary", index=False)

    print("Excel file created: MediMind_All_Login_Accounts.xlsx")

if __name__ == "__main__":
    main()
