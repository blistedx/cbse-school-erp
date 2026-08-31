/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');

const filePath = 'src/app/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace #2563EB with theme variables
content = content.replace(/bg-\[#2563EB\] hover:bg-\[#1D4ED8\]/g, 'bg-[var(--ink-navy)] hover:bg-[var(--red-pen)]');
content = content.replace(/bg-\[#2563EB\]/g, 'bg-[var(--board-1)]');
content = content.replace(/hover:bg-\[#1D4ED8\]/g, 'hover:bg-[var(--board-2)]');

// 2. Action buttons (Collect Fees, etc.)
content = content.replace(/text-blue-600 bg-blue-50 hover:bg-blue-100/g, 'text-[var(--red-pen)] bg-[var(--red-pen)]/10 hover:bg-[var(--red-pen)] hover:text-white border border-[var(--red-pen)]/20');
content = content.replace(/text-blue-600 bg-blue-50/g, 'text-[var(--red-pen)] bg-[var(--red-pen)]/10');
content = content.replace(/text-blue-700 bg-blue-100/g, 'text-[var(--ink-navy)] bg-slate-100');

// 3. Admission No and link colors
content = content.replace(/text-blue-600 font-mono/g, 'text-[var(--ink-navy)] hover:text-[var(--red-pen)] font-mono');
content = content.replace(/text-blue-600 font-semibold/g, 'text-[var(--ink-navy)] font-semibold');
content = content.replace(/text-blue-600 cursor-pointer/g, 'text-[var(--ink-navy)] hover:text-[var(--red-pen)] cursor-pointer');

// 4. Form focus and borders
content = content.replace(/focus:border-blue-500/g, 'focus:border-[var(--ink-navy)]');
content = content.replace(/focus:ring-blue-500/g, 'focus:ring-[var(--board-1)]');
content = content.replace(/border-blue-500/g, 'border-[var(--ink-navy)]');

// 5. Checkbox text
content = content.replace(/text-blue-600 focus:ring-blue-500/g, 'text-[var(--board-1)] focus:ring-[var(--board-1)]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully transformed app/page.tsx with website theme!');
