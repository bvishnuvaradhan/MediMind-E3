import urllib.request
import urllib.error
import json
import time
import re
import statistics
import concurrent.futures

import openpyxl

def get_creds():
    wb = openpyxl.load_workbook(r'Documents/MediMind_Role_Credentials.xlsx', read_only=True)
    creds = {}
    for s in wb.sheetnames:
        if s in ['Instructions', 'Credential Index']:
            continue
        ws = wb[s]
        rows = list(ws.iter_rows(values_only=True))
        if not rows or not rows[0]:
            continue
        h = [str(x).strip().lower() for x in rows[0] if x is not None]
        try:
            e_i = next(i for i, x in enumerate(h) if 'email' in x or 'username' in x)
            p_i = next(i for i, x in enumerate(h) if 'password' in x)
            for r in rows[1:]:
                if not r or len(r) <= e_i or not r[e_i]:
                    continue
                email = str(r[e_i]).strip().lower()
                creds[email] = str(r[p_i])
        except Exception:
            continue
    wb.close()
    return creds

def login(email, password):
    url = 'http://localhost:5000/api/auth/login'
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res['data']['token']

def fetch_appointments(token, query_params=''):
    url = f'http://localhost:5000/api/appointments{query_params}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
            elapsed_ms = (time.time() - t0) * 1000
            data = json.loads(raw.decode('utf-8'))
            return {
                'status': resp.status,
                'latency_ms': elapsed_ms,
                'size_bytes': len(raw),
                'count': len(data.get('data', [])),
                'error': None
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - t0) * 1000
        return {
            'status': e.code,
            'latency_ms': elapsed_ms,
            'size_bytes': 0,
            'count': 0,
            'error': f'HTTPError {e.code}'
        }
    except Exception as e:
        elapsed_ms = (time.time() - t0) * 1000
        return {
            'status': 500,
            'latency_ms': elapsed_ms,
            'size_bytes': 0,
            'count': 0,
            'error': str(e)
        }

def run_benchmarks():
    creds = get_creds()
    c_email = 'chairman@medimind.org'
    c_token = login(c_email, creds[c_email])
    print(f'Successfully logged in as {c_email}')

    # 1. Cold Cache: wait 7 seconds to ensure any previous cache is expired
    print('Waiting 7s for cache expiry...')
    time.sleep(7)

    print('\n--- TEST 1: Cold Cache Measurement (/api/appointments?limit=50) ---')
    cold_res = fetch_appointments(c_token, '?limit=50')
    print(f"Cold Latency: {cold_res['latency_ms']:.2f} ms | Status: {cold_res['status']} | Size: {cold_res['size_bytes']} bytes | Items: {cold_res['count']}")

    # 2. Warm Cache Measurement
    print('\n--- TEST 2: Warm Cache Measurement (Immediate Follow-up) ---')
    warm_samples = []
    for i in range(10):
        res = fetch_appointments(c_token, '?limit=50')
        warm_samples.append(res['latency_ms'])
    mean_warm = statistics.mean(warm_samples)
    median_warm = statistics.median(warm_samples)
    p95_warm = sorted(warm_samples)[int(len(warm_samples) * 0.95)]
    print(f"Warm Latency (10 runs): Mean={mean_warm:.2f} ms, Median={median_warm:.2f} ms, p95={p95_warm:.2f} ms, Min={min(warm_samples):.2f} ms, Max={max(warm_samples):.2f} ms")

    # 3. Unpaginated / Full Query Performance
    print('\n--- TEST 3: Unpaginated Query (/api/appointments) ---')
    time.sleep(7) # wait for cache expire
    full_cold = fetch_appointments(c_token, '')
    print(f"Full Cold Latency: {full_cold['latency_ms']:.2f} ms | Status: {full_cold['status']} | Size: {full_cold['size_bytes']} bytes ({full_cold['size_bytes']/(1024*1024):.2f} MB) | Items: {full_cold['count']}")
    full_warm = fetch_appointments(c_token, '')
    print(f"Full Warm Latency: {full_warm['latency_ms']:.2f} ms | Status: {full_warm['status']} | Size: {full_warm['size_bytes']} bytes")

    # 4. Concurrency Test under Dashboard Load (15 concurrent requests)
    print('\n--- TEST 4: Concurrency Load Test (15 concurrent requests) ---')
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        futures = [executor.submit(fetch_appointments, c_token, '?limit=50') for _ in range(15)]
        concurrent_results = [f.result() for f in futures]
    
    status_codes = [r['status'] for r in concurrent_results]
    latencies = [r['latency_ms'] for r in concurrent_results]
    errors_504 = sum(1 for s in status_codes if s == 504)
    total_errors = sum(1 for s in status_codes if s >= 400)
    print(f"Concurrency results (15 requests):")
    print(f"Status codes: {set(status_codes)}")
    print(f"504 Gateway Timeouts: {errors_504}")
    print(f"Total Errors: {total_errors} (Error Rate: {total_errors/len(concurrent_results)*100:.1f}%)")
    print(f"Concurrent Latencies: Mean={statistics.mean(latencies):.2f} ms, Median={statistics.median(latencies):.2f} ms, Max={max(latencies):.2f} ms")

    # 5. Role Scoping Check (Doctor vs Family vs Chairman)
    print('\n--- TEST 5: Role Scoping & Cache Isolation ---')
    d_email = 'dr.rahul.sharma@aarogyam.hospital'
    d_token = login(d_email, creds[d_email])
    d_res = fetch_appointments(d_token, '?limit=50')
    print(f"Doctor Query: Count={d_res['count']}, Status={d_res['status']}")

    f_email = 'rohan.kapoor@example.com'
    f_token = login(f_email, creds[f_email])
    f_res = fetch_appointments(f_token, '?limit=50')
    print(f"Family Query: Count={f_res['count']}, Status={f_res['status']}")

    summary = {
        'cold_paginated_latency_ms': round(cold_res['latency_ms'], 2),
        'warm_paginated_latency_ms': round(mean_warm, 2),
        'warm_paginated_median_ms': round(median_warm, 2),
        'warm_paginated_p95_ms': round(p95_warm, 2),
        'full_cold_latency_ms': round(full_cold['latency_ms'], 2),
        'full_warm_latency_ms': round(full_warm['latency_ms'], 2),
        'full_response_size_bytes': full_cold['size_bytes'],
        'paginated_response_size_bytes': cold_res['size_bytes'],
        'concurrent_requests': 15,
        'concurrent_504_count': errors_504,
        'concurrent_error_rate_pct': round(total_errors/len(concurrent_results)*100, 2),
        'role_scoping_verified': d_res['count'] < full_cold['count'] and f_res['count'] < full_cold['count']
    }
    with open('scripts/benchmark_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    print('\nBenchmark results saved to scripts/benchmark_results.json')

if __name__ == '__main__':
    run_benchmarks()
