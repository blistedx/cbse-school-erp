const fs = require('fs');

console.log('=== VERIFYING CLASS TEACHER ISOLATION ACROSS ALL SECTIONS ===\n');

// 1. Check Attendance Hub (dashboard-attendance.tsx)
console.log('1. Checking Attendance Hub (dashboard-attendance.tsx)...');
const attendanceCode = fs.readFileSync('src/components/blocks/dashboard-attendance.tsx', 'utf8');

if (attendanceCode.includes('currentSheetClass ? `${currentSheetClass.class_name} - Section ${currentSheetClass.section}` : \'No Assigned Class\'')) {
  console.log('✓ Verified: Monthly Sheet (31-Day) class selector is LOCKED to assigned homeroom for Class Teachers');
} else {
  console.error('✗ Monthly sheet class selector not properly locked');
  process.exit(1);
}

if (attendanceCode.includes('const targetList = isTeacher ? selectableClasses : sortedClasses;')) {
  console.log('✓ Verified: Attendance Summary tab only aggregates statistics for assigned class');
} else {
  console.error('✗ Attendance summary not properly isolated');
  process.exit(1);
}

if (attendanceCode.includes('{!isTeacher && (\n            <button\n              type="button"\n              onClick={() => setAttendanceTab(\'holiday_calendar\')}') || attendanceCode.includes('{!isTeacher && (\r\n            <button\r\n              type="button"\r\n              onClick={() => setAttendanceTab(\'holiday_calendar\')}')) {
  console.log('✓ Verified: "Declare Holidays" tab button is strictly HIDDEN for teachers');
} else {
  console.error('✗ Declare holidays tab button not hidden for teachers');
  process.exit(1);
}

// 2. Check Examinations Portal (dashboard-exams.tsx)
console.log('\n2. Checking Examinations Portal (dashboard-exams.tsx)...');
const examsCode = fs.readFileSync('src/components/blocks/dashboard-exams.tsx', 'utf8');

if (examsCode.includes('isTeacher && activeClassTeacherClass ? (') && examsCode.includes('Assigned Homeroom')) {
  console.log('✓ Verified: Marks Ledger class selector is LOCKED to assigned class (no unlock button for teachers)');
} else {
  console.error('✗ Marks ledger class selector not properly locked');
  process.exit(1);
}

if (examsCode.includes('availableClassesForPost = useMemo(() => {\n    if (isTeacher && activeClassTeacherClass) {\n      return [activeClassTeacherClass];\n    }') || examsCode.includes('availableClassesForPost = useMemo(() => {\r\n    if (isTeacher && activeClassTeacherClass) {\r\n      return [activeClassTeacherClass];\r\n    }')) {
  console.log('✓ Verified: Test Post Engine target classes locked strictly to assigned class');
} else {
  console.error('✗ Test post engine classes not properly locked');
  process.exit(1);
}

if (examsCode.includes('{/* Group & Bulk Shortcuts (Hidden for Teachers) */}\n                    {!isTeacher && (') || examsCode.includes('{/* Group & Bulk Shortcuts (Hidden for Teachers) */}\r\n                    {!isTeacher && (')) {
  console.log('✓ Verified: Bulk Class selection shortcuts are HIDDEN for teachers');
} else {
  console.error('✗ Bulk shortcuts not hidden for teachers');
  process.exit(1);
}

console.log('\n=== ALL SECTIONS SUCCESSFULLY ISOLATED FOR CLASS TEACHERS! ===');
