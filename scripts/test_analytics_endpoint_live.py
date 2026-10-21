import requests
import json

# 1. Login as Chairman
auth_res = requests.post(
    "http://localhost:5000/api/auth/login",
    json={"email": "chairman@medimind.org", "password": "Chair#2026$01!Dev"}
)
print(f"Chairman Login Status: {auth_res.status_code}")
chairman_token = auth_res.json()["data"]["token"]

headers = {
    "Authorization": f"Bearer {chairman_token}",
    "Content-Type": "application/json"
}

# 2. Test GET /api/ai/analytics via Gateway (Port 5000)
ai_analytics_res = requests.get("http://localhost:5000/api/ai/analytics", headers=headers)
print(f"\nGET /api/ai/analytics Status: {ai_analytics_res.status_code}")
if ai_analytics_res.status_code == 200:
    data = ai_analytics_res.json()["data"]
    print("AI Analytics (All Time):")
    print(f"  Total Inferences: {data.get('totalInferences')}")
    print(f"  Monthly Volume Count: {len(data.get('monthlyVolume', []))}")
    for m in data.get("monthlyVolume", []):
        print(f"    {m['month']}: total={m['total']}, fracture={m['fracture']}, diabetes={m['diabetes']}, heart={m['heart']}, general={m['general']}")
    print("  Linkage:", data.get("linkage"))
    print("  Modules:")
    for k, v in data.get("modules", {}).items():
        print(f"    {k}: totalRuns={v.get('totalRuns')}, accuracy={v.get('accuracy')}, latency={v.get('latency')}")

# 3. Test Date Range Filter on AI Analytics (October 2026 only)
ai_oct_res = requests.get("http://localhost:5000/api/ai/analytics?start_date=2026-10-01&end_date=2026-10-31", headers=headers)
print(f"\nGET /api/ai/analytics (Oct 2026 filter) Status: {ai_oct_res.status_code}")
if ai_oct_res.status_code == 200:
    oct_data = ai_oct_res.json()["data"]
    print(f"  Oct 2026 Total Inferences: {oct_data.get('totalInferences')}")
    print(f"  Oct 2026 Monthly Volume: {oct_data.get('monthlyVolume')}")

# 4. Test GET /api/appointments/stats via Gateway (Port 5000)
appt_stats_res = requests.get("http://localhost:5000/api/appointments/stats", headers=headers)
print(f"\nGET /api/appointments/stats (All Time) Status: {appt_stats_res.status_code}")
if appt_stats_res.status_code == 200:
    sdata = appt_stats_res.json()["data"]
    print(f"  Total Appointments: {sdata.get('total')}")
    print(f"  Completed: {sdata.get('completed')}")
    print(f"  Upcoming: {sdata.get('upcoming')}")
    print(f"  Cancelled: {sdata.get('cancelled')}")
    print(f"  Monthly Trends:")
    for t in sdata.get("monthlyTrends", []):
        print(f"    {t['month']}: volume={t['volume']}, completed={t['completed']}, scheduled={t['scheduled']}")

# 5. Test Date Range Filter on Appointment Stats (October 2026 only)
appt_oct_res = requests.get("http://localhost:5000/api/appointments/stats?startDate=2026-10-01&endDate=2026-10-31", headers=headers)
print(f"\nGET /api/appointments/stats (Oct 2026 filter) Status: {appt_oct_res.status_code}")
if appt_oct_res.status_code == 200:
    oct_sdata = appt_oct_res.json()["data"]
    print(f"  Oct 2026 Total Appointments: {oct_sdata.get('total')}")
    print(f"  Oct 2026 Completed: {oct_sdata.get('completed')}")
    print(f"  Oct 2026 Upcoming: {oct_sdata.get('upcoming')}")
    print(f"  Oct 2026 Cancelled: {oct_sdata.get('cancelled')}")
    print(f"  Oct 2026 Monthly Trends: {oct_sdata.get('monthlyTrends')}")
