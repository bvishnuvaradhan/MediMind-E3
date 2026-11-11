import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';

const envContent = fs.readFileSync('./backend/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const aiDb = mongoose.connection.useDb('medimind_ai');

const totalWithHosp = await aiDb.collection('predictions').countDocuments({ hospital_id: { $ne: null } });
const totalWithoutHosp = await aiDb.collection('predictions').countDocuments({
  $or: [{ hospital_id: null }, { hospital_id: { $exists: false } }]
});
console.log(`Predictions with hospital_id: ${totalWithHosp}`);
console.log(`Predictions without hospital_id (e.g. standalone): ${totalWithoutHosp}`);

// Monthly predictions aggregation directly from medimind_ai.predictions by hospital and created_at!
const monthlyByHosp = await aiDb.collection('predictions').aggregate([
  { $match: { hospital_id: { $ne: null } } },
  {
    $project: {
      hospital_id: 1,
      bucket: {
        $substrCP: [
          {
            $cond: [
              { $eq: [{ $type: '$created_at' }, 'date'] },
              { $dateToString: { format: '%Y-%m', date: '$created_at' } },
              { $ifNull: ['$created_at', ''] }
            ]
          },
          0,
          7
        ]
      }
    }
  },
  {
    $group: {
      _id: { hospital_id: '$hospital_id', bucket: '$bucket' },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.bucket': 1 } }
]).toArray();

console.log('\nAuthoritative Monthly AI Predictions by Hospital (Direct from medimind_ai):');
console.table(monthlyByHosp.map(r => ({
  hospital_id: r._id.hospital_id.toString(),
  bucket: r._id.bucket,
  count: r.count
})));

await mongoose.disconnect();
