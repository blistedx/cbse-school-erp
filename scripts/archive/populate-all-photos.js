const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP";

// Faculty curated portraits (high quality teacher portraits)
const facultyPortraits = {
  male: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  ],
  female: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&auto=format&fit=crop&q=80'
  ]
};

function generateStudentAvatar(student, index) {
  const gender = student.gender || (index % 2 === 0 ? 'Male' : 'Female');
  const house = student.house || 'Red House';
  const name = student.full_name || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const houseColors = {
    'Red House': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', accent: '#f87171' },
    'Blue House': { bg: '#e0f2fe', border: '#3b82f6', text: '#1e40af', accent: '#60a5fa' },
    'Green House': { bg: '#dcfce7', border: '#22c55e', text: '#166534', accent: '#4ade80' },
    'Yellow House': { bg: '#fef9c3', border: '#eab308', text: '#854d0e', accent: '#facc15' }
  };

  const palette = houseColors[house] || { bg: '#f3f4f6', border: '#6b7280', text: '#1f2937', accent: '#9ca3af' };
  const iconEmoji = gender === 'Female' ? '👧' : '👦';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="${palette.bg}" stroke="${palette.border}" stroke-width="4"/>
    <circle cx="60" cy="50" r="26" fill="${palette.accent}" opacity="0.35"/>
    <text x="60" y="58" font-size="28" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
    <rect x="25" y="86" width="70" height="22" rx="11" fill="${palette.border}"/>
    <text x="60" y="98" font-size="11" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  console.log('🔄 Checking and populating photos in MongoDB...');

  // 1. Teachers
  const teachers = await db.collection('teachers').find({}).toArray();
  console.log(`Found ${teachers.length} teachers.`);

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const isFemale = (t.gender || '').toUpperCase() === 'FEMALE' || /mrs|miss|dr\.\s*meenakshi|ananya|priya|sunita|shweta|pooja|sneha|kavita/i.test(t.full_name || '');
    const pool = isFemale ? facultyPortraits.female : facultyPortraits.male;
    const photoUrl = pool[i % pool.length];

    await db.collection('teachers').updateOne(
      { _id: t._id },
      { $set: { photo: photoUrl, avatar: photoUrl } }
    );
  }
  console.log(`✅ Updated all ${teachers.length} teachers with high quality profile photos!`);

  // 2. Students without photos
  const studentsWithoutPhoto = await db.collection('students').find({
    $or: [{ photo: { $exists: false } }, { photo: '' }, { photo: null }]
  }).toArray();
  console.log(`Found ${studentsWithoutPhoto.length} students without photos.`);

  for (let i = 0; i < studentsWithoutPhoto.length; i++) {
    const s = studentsWithoutPhoto[i];
    const avatar = generateStudentAvatar(s, i);
    await db.collection('students').updateOne(
      { _id: s._id },
      { $set: { photo: avatar, avatar: avatar } }
    );
  }
  console.log(`✅ Updated ${studentsWithoutPhoto.length} students with SVG avatars!`);

  await client.close();
  console.log('🎉 Done!');
}

run().catch(console.error);
