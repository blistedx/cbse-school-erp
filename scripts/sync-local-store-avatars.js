const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

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

function generateTeacherAvatar(teacher, index) {
  const gender = teacher.gender || (index % 2 === 0 ? 'Female' : 'Male');
  const name = teacher.full_name || 'Faculty';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const deptColors = [
    { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6', accent: '#a78bfa' },
    { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', accent: '#818cf8' },
    { bg: '#cffafe', border: '#06b6d4', text: '#155e75', accent: '#22d3ee' },
    { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', accent: '#f472b6' },
    { bg: '#ffedd5', border: '#f97316', text: '#9a3412', accent: '#fb923c' },
  ];

  const palette = deptColors[index % deptColors.length];
  const iconEmoji = gender === 'Female' ? '👩‍🏫' : '👨‍🏫';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="${palette.bg}" stroke="${palette.border}" stroke-width="4"/>
    <circle cx="60" cy="50" r="26" fill="${palette.accent}" opacity="0.35"/>
    <text x="60" y="58" font-size="28" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
    <rect x="20" y="86" width="80" height="22" rx="11" fill="${palette.border}"/>
    <text x="60" y="98" font-size="10" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials} • ${teacher.staff_code || 'STAFF'}</text>
  </svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
}

console.log('Attaching avatars to students in erp_store.json...');
if (Array.isArray(store.students)) {
  for (let i = 0; i < store.students.length; i++) {
    const s = store.students[i];
    const av = generateStudentAvatar(s, i);
    s.avatar = av;
    s.photo = av;
  }
}

console.log('Attaching avatars to teachers in erp_store.json...');
if (Array.isArray(store.teachers)) {
  for (let i = 0; i < store.teachers.length; i++) {
    const t = store.teachers[i];
    const av = generateTeacherAvatar(t, i);
    t.avatar = av;
    t.photo = av;
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ erp_store.json updated with student and teacher profile pictures!');
