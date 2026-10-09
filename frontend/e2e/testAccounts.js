import { execSync } from 'child_process';

let accountsCache = null;

export function getTestAccounts() {
  if (accountsCache) {
    return accountsCache;
  }
  const pyCode = [
    'import openpyxl, json',
    'wb = openpyxl.load_workbook(r"D:\\MediMind_Backups\\MediMind_Credentials_20261009.xlsx", read_only=True)',
    'creds = {}',
    'for s in wb.sheetnames:',
    '    ws = wb[s]',
    '    rows = list(ws.iter_rows(values_only=True))',
    '    h = [str(x).strip().lower() for x in rows[0]]',
    '    e_i = next(i for i, x in enumerate(h) if "email" in x or "username" in x)',
    '    p_i = next(i for i, x in enumerate(h) if "password" in x)',
    '    n_i = next(i for i, x in enumerate(h) if "name" in x)',
    '    for r in rows[1:]:',
    '        email = str(r[e_i]).strip().lower()',
    '        creds[email] = {"password": str(r[p_i]), "name": str(r[n_i]), "role": s}',
    'print(json.dumps(creds))'
  ].join('\n');

  try {
    const raw = execSync('python', { input: pyCode, encoding: 'utf-8' });
    accountsCache = JSON.parse(raw.trim());
  } catch (err) {
    console.error('Failed to load credentials workbook:', err.message);
    accountsCache = {};
  }
  return accountsCache;
}

export function getAccount(first, second) {
  const accounts = getTestAccounts();
  const email = (second || first).toLowerCase().trim();
  const acc = accounts[email];
  if (!acc) {
    throw new Error(`Test account not found in workbook for email: ${email}`);
  }
  return { ...acc, email };
}
