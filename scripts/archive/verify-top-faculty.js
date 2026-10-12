const fetch = globalThis.fetch;

async function test() {
  const loginRes = await fetch('http://localhost:5173/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      school_code: 'DPS2026',
      username: 'PRINCIPAL',
      password: '123456'
    })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const res = await fetch('http://localhost:5173/api/teachers?school_id=DPS2026&session=2026-27', {
    headers: { 'Cookie': cookie || '' }
  });
  const data = await res.json();
  console.log('Total teachers:', data.teachers?.length);

  function resolveRole(t) {
    if (!t) return 'TEACHER';
    if (t.role) {
      const r = (t.role || '').toUpperCase();
      if (r === 'PRINCIPAL' || r === 'ADMIN' || r === 'VICE_PRINCIPAL' || r === 'TEACHER' || r === 'ACCOUNTANT' || r === 'DRIVER' || r === 'LIBRARIAN' || r === 'SECURITY_GUARD') {
        return r;
      }
    }
    const desig = (t.designation || '').toLowerCase();
    const dept = (t.department || '').toLowerCase();
    const code = (t.staff_code || t.employee_code || '').toUpperCase();
    const name = (t.full_name || '').toLowerCase();

    if (name.includes('abhishek shukla') || code.startsWith('PRIN') || (desig.includes('principal') && !desig.includes('vice'))) return 'PRINCIPAL';
    if (desig.includes('vice principal') || dept.includes('vice principal')) return 'VICE_PRINCIPAL';
    if (dept.includes('leadership') && !desig.includes('vice')) return 'PRINCIPAL';
    return 'TEACHER';
  }

  const sorted = [...(data.teachers || [])].sort((a, b) => {
    const roleA = resolveRole(a);
    const roleB = resolveRole(b);

    if (roleA === 'PRINCIPAL' && roleB !== 'PRINCIPAL') return -1;
    if (roleB === 'PRINCIPAL' && roleA !== 'PRINCIPAL') return 1;

    if (roleA === 'VICE_PRINCIPAL' && roleB !== 'VICE_PRINCIPAL') return -1;
    if (roleB === 'VICE_PRINCIPAL' && roleA !== 'VICE_PRINCIPAL') return 1;

    return (a.full_name || '').localeCompare(b.full_name || '');
  });

  console.log('\n--- TOP 5 FACULTY IN ROSTER TABLE ---');
  sorted.slice(0, 5).forEach((t, i) => {
    console.log('Rank ' + (i + 1) + ': [' + t.staff_code + '] ' + t.full_name + ' | ERP Role: ' + resolveRole(t) + ' | Designation: ' + t.designation);
  });
}
test();
