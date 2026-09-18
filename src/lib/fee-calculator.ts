import {
  OneTimeFeeHead,
  TuitionFeeHead,
  TransportFeeHead,
  HostelFeeStructure,
  DEFAULT_HOSTEL_FEES,
  DEFAULT_ONE_TIME_FEES,
  DEFAULT_TUITION_FEES,
  DEFAULT_TRANSPORT_FEES,
  getStandardTuitionRate,
  getStandardAnnualFeeRate,
  getStandardTransportRate
} from './monthly-fee-helper';

export type {
  OneTimeFeeHead,
  TuitionFeeHead,
  TransportFeeHead,
  HostelFeeStructure
};

export {
  DEFAULT_HOSTEL_FEES,
  DEFAULT_ONE_TIME_FEES,
  DEFAULT_TUITION_FEES,
  DEFAULT_TRANSPORT_FEES,
  getStandardTuitionRate,
  getStandardAnnualFeeRate,
  getStandardTransportRate
};

/**
 * Retrieve current established fee structure from localStorage or fallback to defaults
 */
export function getEstablishedFeeStructure() {
  let oneTime = DEFAULT_ONE_TIME_FEES;
  let tuition = DEFAULT_TUITION_FEES;
  let transport = DEFAULT_TRANSPORT_FEES;
  let hostel = DEFAULT_HOSTEL_FEES;

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

    try {
      const savedHostel = localStorage.getItem('cbse_hostel_fees');
      if (savedHostel) hostel = JSON.parse(savedHostel);
    } catch (_) {}
  }

  return { oneTime, tuition, transport, hostel };
}

/**
 * Map any class name string (e.g. "Class 6", "Class VI-A", "Nursery", "10", "Class 11 - PCM")
 * to its corresponding monthly tuition fee and annual fee using unified rate tables.
 */
export function getFeeRatesForClass(className: string) {
  const { oneTime } = getEstablishedFeeStructure();
  const monthlyTuition = getStandardTuitionRate(className);
  const annualFee = getStandardAnnualFeeRate(className);

  const normalized = (className || '').toUpperCase().trim();
  let gradeLevel = -1;
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
  } else {
    gradeLevel = 0;
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
  isRte?: 'YES' | 'NO' | boolean | string;
  hostelOpted?: 'NO' | 'WITHOUT_AC' | 'WITH_AC' | 'YES' | 'YES_AC' | 'YES_NON_AC' | string;
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
  // RTE
  isRte: boolean;
  rteTuitionWaiver: number;
  // Hostel
  isHostelOpted: boolean;
  hostelRoomType: 'WITHOUT_AC' | 'WITH_AC' | 'NO';
  monthlyHostelRate: number;
  hostelFeeTotal: number;
  hostelSecurityMoney: number;
  totalPayable: number;
}

/**
 * Primary calculation function that implements:
 * 1. Automatic fee lookup based on Class
 * 2. Admission Type head inclusion (New = Admission Fee + Annual + Tuition; Old = Annual + Tuition)
 * 3. Months calculated from April up to admission month (e.g. July = 4 months)
 * 4. Transport fee payable monthly (multiplied by months enrolled)
 * 5. RTE (Right to Education) 100% academic fee waiver
 * 6. Hostel Security Money (₹10,000 Refundable) + Monthly Hostel Fee (Without AC @ ₹6,000/mo or With AC @ ₹7,833/mo)
 */
export function calculateRegistrationFees(params: FeeCalculationParams): FeeCalculationResult {
  const { oneTime, transport, hostel } = getEstablishedFeeStructure();
  const classRates = getFeeRatesForClass(params.className);
  const monthsInfo = calculateMonthsFromApril(params.admissionDate, params.academicSession);

  const isNewAdmission = (params.admissionType || 'NEW').toUpperCase() !== 'OLD';
  const isTransportOpted = (params.transportOpted || 'NO').toUpperCase() === 'YES';
  const isRte = (params.isRte === true || params.isRte === 'YES');
  
  const hostelOpt = (params.hostelOpted || 'NO').toUpperCase();
  const isHostelOpted = hostelOpt === 'WITHOUT_AC' || hostelOpt === 'WITH_AC' || hostelOpt === 'YES' || hostelOpt === 'YES_AC' || hostelOpt === 'YES_NON_AC';
  const hostelRoomType: 'WITHOUT_AC' | 'WITH_AC' | 'NO' = 
    (hostelOpt === 'WITH_AC' || hostelOpt === 'YES_AC') ? 'WITH_AC' : isHostelOpted ? 'WITHOUT_AC' : 'NO';

  // Admission Fee: Only for NEW admissions (waived for RTE)
  const admissionFee = isNewAdmission ? (isRte ? 0 : classRates.admissionFee) : 0;

  // Annual Fee: Charged once per session for both New and Old admissions (waived for RTE)
  const annualFee = isRte ? 0 : classRates.annualFee;

  // Tuition Fee: Monthly rate * months elapsed from April (100% waived for RTE)
  const regularMonthlyTuition = classRates.monthlyTuition;
  const rteTuitionWaiver = isRte ? (regularMonthlyTuition * monthsInfo.monthCount) : 0;
  const monthlyTuitionRate = isRte ? 0 : regularMonthlyTuition;
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

  // Hostel Fee: Monthly rate * months elapsed from April + Refundable Security Deposit
  let monthlyHostelRate = 0;
  let hostelFeeTotal = 0;
  let hostelSecurityMoney = 0;

  if (isHostelOpted) {
    monthlyHostelRate = hostelRoomType === 'WITH_AC' ? (hostel.withAcMonthly || 7833) : (hostel.withoutAcMonthly || 6000);
    hostelFeeTotal = monthlyHostelRate * monthsInfo.monthCount;
    // Security Money is one-time upon admission
    hostelSecurityMoney = isNewAdmission ? (hostel.securityMoney || 10000) : 0;
  }

  const totalPayable = admissionFee + annualFee + tuitionFeeTotal + transportFeeTotal + hostelFeeTotal + hostelSecurityMoney;

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
    isRte,
    rteTuitionWaiver,
    isHostelOpted,
    hostelRoomType,
    monthlyHostelRate,
    hostelFeeTotal,
    hostelSecurityMoney,
    totalPayable,
  };
}
