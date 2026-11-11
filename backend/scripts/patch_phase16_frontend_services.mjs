import fs from 'fs';
import path from 'path';

// 1. Patch chairmanService.js
const chairPath = path.resolve('frontend/src/services/chairmanService.js');
let chairContent = fs.readFileSync(chairPath, 'utf-8').replace(/\r\n/g, '\n');

const chairTarget = `    result.monthlyIntakeTrends = stats?.monthlyIntakeTrends || [];
    result.granularity = isSingleMonth ? 'daily' : 'monthly';`;

const chairReplacement = `    result.monthlyIntakeTrends = stats?.monthlyIntakeTrends || [];
    result.cutoffDate = stats?.cutoffDate || '2026-11-04';
    result.systemDate = stats?.systemDate || '2026-10-28';
    result.dueWorkload = stats?.dueWorkload;
    result.futureWorkload = stats?.futureWorkload;
    result.unresolvedDueCount = stats?.unresolvedDueCount;
    result.granularity = isSingleMonth ? 'daily' : 'monthly';`;

if (!chairContent.includes(chairTarget)) {
  console.error('Chairman target not found!');
  process.exit(1);
}
chairContent = chairContent.replace(chairTarget, chairReplacement);
fs.writeFileSync(chairPath, chairContent, 'utf-8');
console.log('Patched chairmanService.js successfully!');

// 2. Patch hospitalAdminService.js
const adminPath = path.resolve('frontend/src/services/hospitalAdminService.js');
let adminContent = fs.readFileSync(adminPath, 'utf-8').replace(/\r\n/g, '\n');

const adminTarget = `          monthlyIntakeTrends: stats.monthlyIntakeTrends || [],
        };

        adminCache[cacheKey] = resultAnalytics;`;

const adminReplacement = `          monthlyIntakeTrends: stats.monthlyIntakeTrends || [],
          cutoffDate: stats.cutoffDate || '2026-11-04',
          systemDate: stats.systemDate || '2026-10-28',
          dueWorkload: stats.dueWorkload,
          futureWorkload: stats.futureWorkload,
          unresolvedDueCount: stats.unresolvedDueCount,
        };

        adminCache[cacheKey] = resultAnalytics;`;

if (!adminContent.includes(adminTarget)) {
  console.error('Admin target not found!');
  process.exit(1);
}
adminContent = adminContent.replace(adminTarget, adminReplacement);
fs.writeFileSync(adminPath, adminContent, 'utf-8');
console.log('Patched hospitalAdminService.js successfully!');
