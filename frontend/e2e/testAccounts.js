import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

let accountsCache = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultWorkbookPath = path.resolve(__dirname, '../../Documents/MediMind_Role_Credentials.xlsx');

export function getTestAccounts(customPath) {
  if (accountsCache) {
    return accountsCache;
  }
  const wbPath = (customPath || defaultWorkbookPath).replace(/\\/g, '/');
  const pyCode = [
    'import openpyxl, json, sys',
    `p = r"${wbPath}"`,
    'wb = openpyxl.load_workbook(p, read_only=True)',
    'creds = {}',
    'for s in wb.sheetnames:',
    '    if s in ["Instructions", "Credential Index"]:',
    '        continue',
    '    ws = wb[s]',
    '    rows = list(ws.iter_rows(values_only=True))',
    '    if not rows or not rows[0]:',
    '        continue',
    '    h = [str(x).strip().lower() for x in rows[0] if x is not None]',
    '    try:',
    '        e_i = next(i for i, x in enumerate(h) if "email" in x or "username" in x)',
    '        p_i = next(i for i, x in enumerate(h) if "password" in x)',
    '        n_i = next((i for i, x in enumerate(h) if "name" in x), e_i)',
    '        r_i = next((i for i, x in enumerate(h) if "role" in x), None)',
    '        for r in rows[1:]:',
    '            if not r or len(r) <= e_i or not r[e_i]:',
    '                continue',
    '            email = str(r[e_i]).strip().lower()',
    '            role_val = str(r[r_i]) if r_i is not None and len(r) > r_i and r[r_i] else s',
    '            creds[email] = {"password": str(r[p_i]), "name": str(r[n_i]), "role": role_val}',
    '    except Exception:',
    '        continue',
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
