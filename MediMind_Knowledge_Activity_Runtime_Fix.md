# MediMind — Knowledge Activity View Runtime Exception Resolution

**Date:** 2026-10-23  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Component:** `frontend/src/components/chairman/views/KnowledgeActivityView.jsx`

---

## 1. Defect Description & Runtime Stack Trace

When navigating to the **Knowledge Activity** tab in the Platform Owner portal, the entire application view crashed with an uncaught runtime exception:
```text
Uncaught ReferenceError: Cannot access 'isUnderPeerReview' before initialization
    at KnowledgeActivityView.jsx:98:13
    at Array.filter (<anonymous>)
    at KnowledgeActivityView.jsx:95:25
    at mountMemo (react-dom.development.js:1543)
    at useMemo (react.development.js:1651)
    at KnowledgeActivityView (KnowledgeActivityView.jsx:94:20)
```

---

## 2. Root Cause Analysis (JavaScript Temporal Dead Zone - TDZ)

1. In JavaScript (ES6+), variables declared with `const` and `let` are not hoisted with initialization and reside in the **Temporal Dead Zone (TDZ)** from the start of their enclosing scope until execution reaches their declaration statement.
2. In `KnowledgeActivityView.jsx`, the multi-filter calculation:
   ```javascript
   const filtered = useMemo(() => {
     return articles.filter((a) => {
       if (activeTab === 'published') {
         if (isUnderPeerReview(a) || isProtocolOrSop(a)) return false;
       } ...
   ```
   was invoked at line 94 during the component's initial render cycle.
3. However, `const isProtocolOrSop` was declared at line 185 and `const isUnderPeerReview` was declared at line 191.
4. Because the `useMemo` filter callback ran on line 98 before lines 185 and 191 were executed, accessing `isUnderPeerReview` triggered an immediate `ReferenceError`.

---

## 3. Remediation Architecture

Because `isProtocolOrSop` and `isUnderPeerReview` are pure predicate functions that depend solely on their article input argument `a` and have zero dependencies on component state or React hooks, they were elevated to **module scope** before the component definition:

```javascript
import { chairmanService } from '../../../services/chairmanService';

export const isProtocolOrSop = (a) => {
  const cat = (a?.category || '').toLowerCase();
  const tags = Array.isArray(a?.tags) ? a.tags.map(t => String(t).toLowerCase()) : [];
  return cat === 'clinical protocols & sops' || cat.includes('protocol') || cat.includes('sop') || tags.some(t => t.includes('protocol') || t.includes('sop') || t.includes('guideline'));
};

export const isUnderPeerReview = (a) => {
  const st = (a?.status || '').toUpperCase();
  return st === 'UNDER REVIEW' || st === 'IN_REVIEW' || st === 'UNDER_REVIEW' || st === 'CHANGES REQUESTED' || st === 'CHANGES_REQUESTED' || st === 'SUBMITTED';
};

export function KnowledgeActivityView() {
  ...
```

The duplicate declarations inside the component body were cleanly excised.

---

## 4. Verification Evidence

1. **Compilation & Packaging:**
   Executed production Vite build from `frontend/`:
   ```text
   > medimind@0.0.0 build
   > vite build

   vite v8.3.0 building client environment for production...
   transforming...
   ✓ 2004 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html                     0.47 kB │ gzip:   0.30 kB
   dist/assets/index-Bi0MeUTI.css     95.14 kB │ gzip:  14.46 kB
   dist/assets/index-T3krIhOr.js   1,468.42 kB │ gzip: 314.94 kB
   ✓ built in 847ms
   ```
2. **Behavioral Testing:** The Knowledge Activity tab mounts, multi-filters articles across Hospital, Department, Status, Author, and Period, and evaluates protocols and peer reviews with 0 runtime errors.
