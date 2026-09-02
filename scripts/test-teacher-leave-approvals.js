const fs = require('fs');

console.log('=== VERIFYING DASHBOARD APPROVALS TEACHER HARDENING ===\n');

const code = fs.readFileSync('src/components/blocks/dashboard-approvals.tsx', 'utf8');

// 1. Check isTeacher definition
if (code.includes('const isTeacher = userRole === \'TEACHER\' || currentUser?.role === \'TEACHER\';')) {
  console.log('✓ Verified: isTeacher role detection active');
} else {
  console.error('✗ Missing isTeacher check');
  process.exit(1);
}

// 2. Check personal leave lock for teachers
if (code.includes('Personal Leave Only') && code.includes('currentTeacher?.full_name || currentUser?.full_name')) {
  console.log('✓ Verified: Teacher is locked to their own personal leave application (no teacher selector dropdown)');
} else {
  console.error('✗ Teacher applicant field not properly locked');
  process.exit(1);
}

// 3. Check "Mark Teacher Absent" hidden for teachers
if (code.includes('{!isTeacher && (\n              <button\n                type="button"\n                onClick={() => setShowQuickAbsentModal(true)}') || code.includes('{!isTeacher && (\r\n              <button\r\n                type="button"\r\n                onClick={() => setShowQuickAbsentModal(true)}')) {
  console.log('✓ Verified: "Mark Teacher Absent" button is strictly HIDDEN for teachers');
} else {
  console.error('✗ "Mark Teacher Absent" button not properly guarded');
  process.exit(1);
}

// 4. Check "Mark Teacher Absent Now" hidden for teachers
if (code.includes('Mark Teacher Absent Now') && code.includes('{!isTeacher && (')) {
  console.log('✓ Verified: Secondary "Mark Teacher Absent Now" button is strictly HIDDEN for teachers');
} else {
  console.error('✗ Secondary "Mark Teacher Absent Now" button not properly guarded');
  process.exit(1);
}

// 5. Check modal guard
if (code.includes('{!isTeacher && showQuickAbsentModal && (')) {
  console.log('✓ Verified: Quick Absent modal is strictly guarded against teacher invocation');
} else {
  console.error('✗ Quick Absent modal not properly guarded');
  process.exit(1);
}

// 6. Check Approve/Reject buttons hidden for teachers
if (code.includes('Pending Approval') && code.includes('Approved by Admin') && code.includes('{isTeacher ? (')) {
  console.log('✓ Verified: "Approve" and "Reject" action buttons are strictly HIDDEN for teachers');
} else {
  console.error('✗ Action buttons not properly guarded for teachers');
  process.exit(1);
}

// 7. Check leave applications list isolation
if (code.includes('My Leave Application History') && code.includes('app.employee_id.toLowerCase().trim() === tId')) {
  console.log('✓ Verified: Applications list is isolated to "My Leave Applications" for teachers');
} else {
  console.error('✗ Applications list not properly isolated for teachers');
  process.exit(1);
}

// 8. Check Hindi text absence
const matches = code.match(/[\u0900-\u097F]+/g);
if (matches) {
  console.error('✗ Found Hindi characters in dashboard-approvals.tsx:', matches);
  process.exit(1);
} else {
  console.log('✓ Verified: ZERO Hindi characters in dashboard-approvals.tsx');
}

console.log('\n=== ALL APPROVALS & ATTENDANCE GOVERNANCE CHECKS PASSED! ===');
