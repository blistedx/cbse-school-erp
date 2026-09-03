/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */

export interface OneTimeFeeHead {
  id: string;
  particulars: string;
  amount: number;
}

export interface TuitionFeeHead {
  id: string;
  className: string;
  monthlyFee: number;
  quarterlyFee: number;
}

export interface TransportFeeHead {
  id: string;
  slab: string;
  monthlyFee: number;
}

export const DEFAULT_ONE_TIME_FEES: OneTimeFeeHead[] = [
  { id: '1', particulars: 'Prospectus + Registration Fees', amount: 1000 },
  { id: '2', particulars: 'Admission Fee (Non-Refundable)', amount: 5000 },
  { id: '3', particulars: 'Annual Fee (PG to VIII)', amount: 5000 },
  { id: '4', particulars: 'Annual Fee (IX to XII)', amount: 6000 },
  { id: '5', particulars: 'Hostel Security Money (Refundable)', amount: 10000 },
  { id: '6', particulars: 'Transfer Certificate / Character Certificate', amount: 1000 },
];

export const DEFAULT_TUITION_FEES: TuitionFeeHead[] = [
  { id: '1', className: 'PG, LKG & UKG', monthlyFee: 1000, quarterlyFee: 3000 },
  { id: '2', className: 'Class I & II', monthlyFee: 1400, quarterlyFee: 4200 },
  { id: '3', className: 'Class III to V', monthlyFee: 1600, quarterlyFee: 4800 },
  { id: '4', className: 'Class VI to VIII', monthlyFee: 1800, quarterlyFee: 5400 },
  { id: '5', className: 'Class IX & X', monthlyFee: 2000, quarterlyFee: 6000 },
  { id: '6', className: 'Class XI & XII', monthlyFee: 2400, quarterlyFee: 7200 },
];

export const DEFAULT_TRANSPORT_FEES: TransportFeeHead[] = [
  { id: '1', slab: '1 to 3 km', monthlyFee: 800 },
  { id: '2', slab: '4 to 6 km', monthlyFee: 900 },
  { id: '3', slab: '7 to 12 km', monthlyFee: 1100 },
  { id: '4', slab: '13 to 16 km', monthlyFee: 1300 },
  { id: '5', slab: '16 to 20 km', monthlyFee: 1800 },
];

/**
 * Retrieve current established fee structure from localStorage or fallback to defaults
 */
export function getEstablishedFeeStructure() {
  let oneTime = DEFAULT_ONE_TIME_FEES;
  let tuition = DEFAULT_TUITION_FEES;
  let transport = DEFAULT_TRANSPORT_FEES;

  if (typeof window !== 'undefined') {
    try {
      const savedOneTime = localStorage.getItem('cbse_one_time_fees');
      if (savedOneTime) oneTime = JSON.parse(savedOneTime);
    } catch (_) {}

    try {
      const savedTuition = localStorage.getItem('cbse_tuition_fees');
      if (savedTuition) tuition = JSON.parse(savedTuition);
    } catch (_) {}

    try {
      const savedTransport = localStorage.getItem('cbse_transport_fees');
      if (savedTransport) transport = JSON.parse(savedTransport);
    } catch (_) {}
  }

  return { oneTime, tuition, transport };
}

/**
 * Map any class name string (e.g. "Class 6", "Class VI-A", "Nursery", "10", "Class 11 - PCM")
 * to its corresponding monthly tuition fee and annual fee.
 */
export function getFeeRatesForClass(className: string) {
  const { oneTime, tuition } = getEstablishedFeeStructure();
  const normalized = (className || '').toUpperCase().trim();

  // Determine Class Level (0 = Pre-primary, 1-12 = Grade)
  let gradeLevel = -1;

  if (
    normalized.includes('PG') ||
    normalized.includes('PLAY') ||
    normalized.includes('NURSERY') ||
    normalized.includes('PRE-NURSERY') ||
    normalized.includes('LKG') ||
    normalized.includes('UKG') ||
    normalized.includes('KG') ||
    normalized.includes('CRECHE')
  ) {
    gradeLevel = 0;
  } else {
    // Extract numerical or Roman numeral grade
    const numMatch = normalized.match(/(?:CLASS|STD|GRADE)?\s*(\d+)/i);
    if (numMatch) {
      gradeLevel = parseInt(numMatch[1], 10);
    } else if (normalized.includes('XII') || normalized.includes('12')) {
      gradeLevel = 12;
    } else if (normalized.includes('XI') || normalized.includes('11')) {
      gradeLevel = 11;
    } else if (normalized.includes('X') || normalized.includes('10')) {
      gradeLevel = 10;
    } else if (normalized.includes('IX') || normalized.includes('9')) {
      gradeLevel = 9;
    } else if (normalized.includes('VIII') || normalized.includes('8')) {
      gradeLevel = 8;
    } else if (normalized.includes('VII') || normalized.includes('7')) {
      gradeLevel = 7;
    } else if (normalized.includes('VI') || normalized.includes('6')) {
      gradeLevel = 6;
    } else if (normalized.includes('V') || normalized.includes('5')) {
      gradeLevel = 5;
    } else if (normalized.includes('IV') || normalized.includes('4')) {
      gradeLevel = 4;
    } else if (normalized.includes('III') || normalized.includes('3')) {
      gradeLevel = 3;
    } else if (normalized.includes('II') || normalized.includes('2')) {
      gradeLevel = 2;
    } else if (normalized.includes('I') || normalized.includes('1')) {
      gradeLevel = 1;
    }
  }

  // Monthly Tuition Rate
  let monthlyTuition = 1800; // default Class 6-8
  if (gradeLevel === 0) {
    monthlyTuition = tuition.find(t => t.className.includes('PG'))?.monthlyFee || 1000;
  } else if (gradeLevel === 1 || gradeLevel === 2) {
    monthlyTuition = tuition.find(t => t.className.includes('I & II'))?.monthlyFee || 1400;
  } else if (gradeLevel >= 3 && gradeLevel <= 5) {
    monthlyTuition = tuition.find(t => t.className.includes('III to V'))?.monthlyFee || 1600;
  } else if (gradeLevel >= 6 && gradeLevel <= 8) {
    monthlyTuition = tuition.find(t => t.className.includes('VI to VIII'))?.monthlyFee || 1800;
  } else if (gradeLevel === 9 || gradeLevel === 10) {
    monthlyTuition = tuition.find(t => t.className.includes('IX & X'))?.monthlyFee || 2000;
  } else if (gradeLevel >= 11) {
    monthlyTuition = tuition.find(t => t.className.includes('XI & XII'))?.monthlyFee || 2400;
  }

  // Annual Fee: PG to VIII = 5000, IX to XII = 6000
  let annualFee = 5000;
  const annualLow = oneTime.find(o => o.particulars.includes('PG to VIII'))?.amount || 5000;
  const annualHigh = oneTime.find(o => o.particulars.includes('IX to XII'))?.amount || 6000;

  if (gradeLevel >= 9) {
    annualFee = annualHigh;
  } else {
    annualFee = annualLow;
  }

  // Admission Fee
  const admissionFee = oneTime.find(o => o.particulars.toLowerCase().includes('admission'))?.amount || 5000;

  return {
    gradeLevel,
    monthlyTuition,
    annualFee,
    admissionFee,
  };
}

export const ACADEMIC_MONTH_NAMES = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

/**
 * Calculate the number of months from session start (April) up to admission date
 * Example:
 *   Admission in April -> 1 Month (April)
 *   Admission in July -> 4 Months (April, May, June, July)
 */
export function calculateMonthsFromApril(admissionDateStr?: string, sessionYearStr?: string): {
  monthCount: number;
  coveredMonths: string[];
  startMonth: string;
  endMonth: string;
} {
  // Parse session start year (e.g. "2026-27" -> 2026)
  let sessionStartYear = 2026;
  if (sessionYearStr) {
    const match = sessionYearStr.match(/^(\d{4})/);
    if (match) sessionStartYear = parseInt(match[1], 10);
  }

  const admDate = admissionDateStr ? new Date(admissionDateStr) : new Date();
  const admMonth = isNaN(admDate.getMonth()) ? new Date().getMonth() : admDate.getMonth(); // 0 = Jan, 3 = Apr
  const admYear = isNaN(admDate.getFullYear()) ? sessionStartYear : admDate.getFullYear();

  // Academic month index where 0 = April, 1 = May, ..., 11 = March
  // Month numbers (1-indexed): 4 = Apr, 5 = May, 6 = Jun, 7 = Jul, 8 = Aug, 9 = Sep, 10 = Oct, 11 = Nov, 12 = Dec, 1 = Jan, 2 = Feb, 3 = Mar
  const jsMonth = admMonth + 1; // 1 to 12

  let academicIndex = 0;
  if (jsMonth >= 4 && jsMonth <= 12) {
    academicIndex = jsMonth - 4; // Apr(4) -> 0, May(5) -> 1, ..., Jul(7) -> 3, Dec(12) -> 8
  } else {
    // Jan(1) -> 9, Feb(2) -> 10, Mar(3) -> 11
    academicIndex = jsMonth + 8;
  }

  // Ensure index is bounded between 0 and 11
  academicIndex = Math.max(0, Math.min(11, academicIndex));

  const monthCount = academicIndex + 1; // E.g. July (idx 3) -> 4 months (Apr, May, Jun, Jul)

  const coveredMonths: string[] = [];
  for (let i = 0; i <= academicIndex; i++) {
    const monthName = ACADEMIC_MONTH_NAMES[i];
    const year = i <= 8 ? sessionStartYear : sessionStartYear + 1;
    coveredMonths.push(`${monthName} ${year}`);
  }

  return {
    monthCount,
    coveredMonths,
    startMonth: coveredMonths[0] || `April ${sessionStartYear}`,
    endMonth: coveredMonths[coveredMonths.length - 1] || `April ${sessionStartYear}`,
  };
}

export interface FeeCalculationParams {
  className: string;
  admissionType?: 'NEW' | 'OLD' | string;
  admissionDate?: string;
  academicSession?: string;
  transportOpted?: 'YES' | 'NO' | string;
  transportSlabId?: string;
}

export interface FeeCalculationResult {
  className: string;
  admissionType: 'NEW' | 'OLD';
  monthCount: number;
  coveredMonths: string[];
  periodLabel: string;
  monthlyTuitionRate: number;
  tuitionFeeTotal: number;
  admissionFee: number;
  annualFee: number;
  isTransportOpted: boolean;
  selectedTransportSlab: TransportFeeHead | null;
  monthlyTransportRate: number;
  transportFeeTotal: number;
  totalPayable: number;
}

/**
 * Primary calculation function that implements:
 * 1. Automatic fee lookup based on Class
 * 2. Admission Type head inclusion (New = Admission Fee + Annual + Tuition; Old = Annual + Tuition)
 * 3. Months calculated from April up to admission month (e.g. July = 4 months)
 * 4. Transport fee payable monthly (multiplied by months enrolled)
 */
export function calculateRegistrationFees(params: FeeCalculationParams): FeeCalculationResult {
  const { oneTime, transport } = getEstablishedFeeStructure();
  const classRates = getFeeRatesForClass(params.className);
  const monthsInfo = calculateMonthsFromApril(params.admissionDate, params.academicSession);

  const isNewAdmission = (params.admissionType || 'NEW').toUpperCase() !== 'OLD';
  const isTransportOpted = (params.transportOpted || 'NO').toUpperCase() === 'YES';

  // Admission Fee: Only for NEW admissions
  const admissionFee = isNewAdmission ? classRates.admissionFee : 0;

  // Annual Fee: Charged once per session for both New and Old admissions
  const annualFee = classRates.annualFee;

  // Tuition Fee: Monthly rate * months elapsed from April
  const monthlyTuitionRate = classRates.monthlyTuition;
  const tuitionFeeTotal = monthlyTuitionRate * monthsInfo.monthCount;

  // Transport Fee: Slab rate * months elapsed from April
  let selectedTransportSlab: TransportFeeHead | null = null;
  let monthlyTransportRate = 0;
  let transportFeeTotal = 0;

  if (isTransportOpted) {
    const slabId = params.transportSlabId || '1';
    selectedTransportSlab = transport.find(t => t.id === slabId) || transport[0] || DEFAULT_TRANSPORT_FEES[0];
    monthlyTransportRate = selectedTransportSlab?.monthlyFee || 800;
    transportFeeTotal = monthlyTransportRate * monthsInfo.monthCount;
  }

  const totalPayable = admissionFee + annualFee + tuitionFeeTotal + transportFeeTotal;

  const periodLabel = monthsInfo.monthCount === 1
    ? `${monthsInfo.startMonth} (1 Month)`
    : `${monthsInfo.startMonth} – ${monthsInfo.endMonth} (${monthsInfo.monthCount} Months)`;

  return {
    className: params.className,
    admissionType: isNewAdmission ? 'NEW' : 'OLD',
    monthCount: monthsInfo.monthCount,
    coveredMonths: monthsInfo.coveredMonths,
    periodLabel,
    monthlyTuitionRate,
    tuitionFeeTotal,
    admissionFee,
    annualFee,
    isTransportOpted,
    selectedTransportSlab,
    monthlyTransportRate,
    transportFeeTotal,
    totalPayable,
  };
}
