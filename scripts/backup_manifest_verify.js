// MongoDB Backup Manifest Generator & Verification Script
const { MongoClient } = require('d:\\projects\\MediMind\\backend\\node_modules\\mongodb');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const BACKUP_DIR = 'D:\\MediMind_Backups\\MediMind_DB_Backup_20261009_000618';
const MONGO_URI = 'mongodb://127.0.0.1:27017';
const MONGORESTORE = 'C:\\Users\\Boga Vishnuvaradhan\\.mongodb-tools\\mongodb-database-tools-windows-x86_64-100.9.0\\bin\\mongorestore.exe';

// MediMind databases only (filter out unrelated ones)
const MEDIMIND_PREFIX = 'medimind_';

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('Connected to MongoDB');

  // 1. Discover all databases
  const adminDb = client.db('admin');
  const { databases } = await adminDb.command({ listDatabases: 1 });
  
  // Filter to MediMind databases (exclude test databases for manifest clarity)
  const medimindDbs = databases.filter(d => d.name.startsWith(MEDIMIND_PREFIX));
  const allBackedUpDbs = databases.filter(d => d.name !== 'local');
  
  console.log(`\nTotal databases on server: ${databases.length}`);
  console.log(`MediMind databases: ${medimindDbs.length}`);
  console.log(`Total backed up (excl local): ${allBackedUpDbs.length}`);

  // 2. Build manifest with collection details
  const manifest = {
    host: '127.0.0.1',
    port: 27017,
    backupTimestamp: '20261009_000618',
    backupPath: BACKUP_DIR,
    mongodumpVersion: 'mongodb-database-tools-100.9.0',
    compression: 'gzip',
    totalDatabasesOnServer: databases.length,
    totalBackedUp: allBackedUpDbs.length,
    medimindDatabases: [],
    otherDatabases: []
  };

  for (const dbInfo of allBackedUpDbs) {
    const db = client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    const collDetails = [];
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      const indexes = await db.collection(coll.name).indexes();
      collDetails.push({
        name: coll.name,
        type: coll.type,
        documentCount: count,
        indexes: indexes.map(i => ({ name: i.name, key: i.key }))
      });
    }
    
    const entry = {
      name: dbInfo.name,
      sizeOnDisk: dbInfo.sizeOnDisk,
      collections: collDetails,
      totalDocuments: collDetails.reduce((sum, c) => sum + c.documentCount, 0),
      totalCollections: collDetails.length
    };
    
    if (dbInfo.name.startsWith(MEDIMIND_PREFIX) && !dbInfo.name.includes('_test')) {
      manifest.medimindDatabases.push(entry);
    } else {
      manifest.otherDatabases.push(entry);
    }
  }

  // Write manifest
  const manifestPath = path.join(BACKUP_DIR, 'backup_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nManifest written to: ${manifestPath}`);

  // 3. Generate checksums
  console.log('\nGenerating checksums...');
  const checksumLines = [];
  
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name !== 'checksums.sha256' && entry.name !== 'backup_manifest.json') {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        const relPath = path.relative(BACKUP_DIR, fullPath);
        checksumLines.push(`${hash}  ${relPath}`);
      }
    }
  }
  
  walkDir(BACKUP_DIR);
  const checksumPath = path.join(BACKUP_DIR, 'checksums.sha256');
  fs.writeFileSync(checksumPath, checksumLines.join('\n') + '\n', 'ascii');
  console.log(`Checksums written to: ${checksumPath} (${checksumLines.length} files)`);

  // 4. Verification: restore core MediMind databases to temporary names and compare counts
  console.log('\n=== RESTORE VERIFICATION ===');
  const coreDbNames = manifest.medimindDatabases.map(d => d.name);
  const verifyResults = [];
  
  for (const dbName of coreDbNames) {
    const tempName = `backup_verify_${dbName}`;
    console.log(`\nRestoring ${dbName} -> ${tempName}...`);
    
    try {
      const cmd = `"${MONGORESTORE}" --uri="${MONGO_URI}" --nsInclude="${dbName}.*" --nsFrom="${dbName}.*" --nsTo="${tempName}.*" --gzip --dir="${BACKUP_DIR}" --quiet`;
      execSync(cmd, { stdio: 'pipe', timeout: 60000 });
      
      // Compare document counts
      const tempDb = client.db(tempName);
      const origEntry = manifest.medimindDatabases.find(d => d.name === dbName);
      let allMatch = true;
      const collResults = [];
      
      for (const collInfo of origEntry.collections) {
        const tempCount = await tempDb.collection(collInfo.name).countDocuments();
        const match = tempCount === collInfo.documentCount;
        if (!match) allMatch = false;
        collResults.push({
          collection: collInfo.name,
          originalCount: collInfo.documentCount,
          restoredCount: tempCount,
          match
        });
        if (!match) {
          console.log(`  WARNING: ${collInfo.name}: original=${collInfo.documentCount} restored=${tempCount}`);
        }
      }
      
      verifyResults.push({ database: dbName, tempDatabase: tempName, status: allMatch ? 'VERIFIED' : 'MISMATCH', collections: collResults });
      console.log(`  ${dbName}: ${allMatch ? 'VERIFIED ✓' : 'MISMATCH ✗'}`);
      
      // Drop temporary database
      await tempDb.dropDatabase();
      console.log(`  Dropped ${tempName}`);
    } catch (err) {
      console.log(`  ERROR restoring ${dbName}: ${err.message}`);
      verifyResults.push({ database: dbName, status: 'ERROR', error: err.message });
      // Try to drop temp db anyway
      try { await client.db(tempName).dropDatabase(); } catch (e) {}
    }
  }

  // 5. Write verification results to manifest
  manifest.verification = {
    timestamp: new Date().toISOString(),
    results: verifyResults
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  // 6. Print summary
  console.log('\n=== BACKUP SUMMARY ===');
  console.log(`Backup location: ${BACKUP_DIR}`);
  console.log(`Compression: gzip`);
  console.log(`Total files checksummed: ${checksumLines.length}`);
  console.log(`\nCore MediMind databases:`);
  for (const db of manifest.medimindDatabases) {
    console.log(`  ${db.name}: ${db.totalCollections} collections, ${db.totalDocuments} documents`);
  }
  console.log(`\nVerification results:`);
  for (const v of verifyResults) {
    console.log(`  ${v.database}: ${v.status}`);
  }

  await client.close();
  console.log('\nBackup process complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
