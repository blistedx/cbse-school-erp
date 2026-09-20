/*! EduSuite Fee Master — Unified Single Source of Truth Reports Engine v4.0.0 */
import { Student } from '../types';
import { FeeAggregateFilters } from './types';
import {
  type ReportColumnDef,
  type ReportSummaryKpi,
  type ReportConfig,
  type ReportQueryResult,
  REPORT_CONFIGS,
} from './report-configs';
import { queryReport } from '../fees/fee-service';

export {
  type ReportColumnDef,
  type ReportSummaryKpi,
  type ReportConfig,
  type ReportQueryResult,
  REPORT_CONFIGS,
};

export async function executeReport(
  schoolId: string,
  reportId: string,
  filters: FeeAggregateFilters,
  students?: Student[]
): Promise<ReportQueryResult> {
  const queryFilters: {
    schoolId?: string;
    session?: string;
    className?: string;
    section?: string;
    month?: string;
    paymentMode?: string;
    search?: string;
  } = {
    schoolId,
    session: filters.session || '2026-27',
    className: filters.classes && filters.classes.length === 1 ? filters.classes[0] : undefined,
    section: filters.sections && filters.sections.length === 1 ? filters.sections[0] : undefined,
    month: filters.months && filters.months.length === 1 ? (filters.months[0] as string) : undefined,
    paymentMode: filters.paymentModes && filters.paymentModes.length === 1 ? filters.paymentModes[0] : undefined,
    search: filters.search,
  };

  return queryReport(reportId, queryFilters);
}
