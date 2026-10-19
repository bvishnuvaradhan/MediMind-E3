from pymongo import MongoClient
import json
from collections import Counter

client = MongoClient('mongodb://127.0.0.1:27017')
know_db = client['medimind_knowledge']
hosp_db = client['medimind_hospital']

articles = list(know_db.articles.find({}))
departments = list(hosp_db.departments.find({}))
hospitals = list(hosp_db.hospitals.find({}))

dept_map = {str(d['_id']): d.get('name') for d in departments}
dept_by_name = {d.get('name'): str(d['_id']) for d in departments}

print(f"Total Knowledge Articles: {len(articles)}")
print(f"Total Departments: {len(departments)}")
print(f"Total Hospitals: {len(hospitals)}")

# 1. Publication statuses
statuses = Counter(a.get('status') for a in articles)
print(f"\nPublication Statuses: {dict(statuses)}")

# 2. Department associations
articles_per_dept = Counter()
orphaned_articles = []

for a in articles:
    did = str(a.get('department_id') or a.get('departmentId') or '')
    dname = a.get('department_name') or a.get('department') or dept_map.get(did)
    if did in dept_map:
        articles_per_dept[dept_map[did]] += 1
    elif dname in dept_by_name:
        articles_per_dept[dname] += 1
    else:
        orphaned_articles.append(str(a['_id']))

print("\n--- Articles per Clinical Department ---")
for dname in sorted(dept_by_name.keys()):
    cnt = articles_per_dept.get(dname, 0)
    print(f"  {dname:30s}: {cnt} articles")

print(f"\nOrphaned articles without department: {len(orphaned_articles)}")

# 3. Check for duplicates (by title)
titles = [a.get('title') for a in articles]
unique_titles = set(titles)
print(f"Unique titles: {len(unique_titles)} / {len(titles)}")

# 4. Check synthetic labels or review metadata
review_metadata_count = sum(1 for a in articles if a.get('reviewed_by') or a.get('author') or a.get('published_at'))
print(f"Articles with review/publication metadata: {review_metadata_count} / {len(articles)}")

result = {
    'total_articles': len(articles),
    'published_count': statuses.get('PUBLISHED', 0),
    'departments_total': len(departments),
    'departments_covered': len(articles_per_dept),
    'articles_per_department': dict(articles_per_dept),
    'orphaned_articles_count': len(orphaned_articles),
    'unique_titles_count': len(unique_titles)
}

with open('scripts/knowledge_audit_results.json', 'w') as f:
    json.dump(result, f, indent=2)
print("\nSaved knowledge audit results to scripts/knowledge_audit_results.json")
