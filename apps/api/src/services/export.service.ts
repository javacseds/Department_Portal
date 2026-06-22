import { prisma } from '@cddas/database';
import * as xlsx from 'xlsx';
import { AppError } from '../middlewares/error';
import { AuditLogService } from './auditLog.service';

export class ExportService {
  /**
   * Generates an Excel report of Faculty Achievements in NAAC/NBA format
   */
  static async exportFacultyAchievements(departmentId?: string, year?: string, userId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`)
      };
    }

    const achievements = await prisma.achievement.findMany({
      where,
      include: {
        faculty: { select: { firstName: true, lastName: true, employeeId: true } },
        department: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Format for NAAC Criterion 3.4 (Research Publications and Awards)
    const data = achievements.map((a, index) => ({
      'S.No': index + 1,
      'Name of the Faculty': `${a.faculty?.firstName || ''} ${a.faculty?.lastName || ''}`.trim(),
      'Employee ID': a.faculty?.employeeId || 'N/A',
      'Department': a.department?.name || 'Institution Level',
      'Type of Achievement': a.type,
      'Title of the Paper/Book/Award': a.title,
      'Details / Journal Name': a.description,
      'Date / Year': new Date(a.date).toLocaleDateString(),
      'Verification Status': a.status,
      'Proof Link': a.proofUrl || 'Not provided'
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Faculty Achievements');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log the export action
    if (userId) {
      await AuditLogService.logAction({
        action: 'EXPORT',
        entity: 'ACHIEVEMENT_REPORT',
        userId: userId,
        details: { format: 'NAAC', recordsCount: data.length, filters: { departmentId, year } }
      });
    }

    return buffer;
  }

  /**
   * Generates an Excel report of Events / Programs organized
   */
  static async exportEventsReport(departmentId?: string, year?: string, userId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
      };
      where.endDate = {
        lte: new Date(`${year}-12-31T23:59:59.999Z`)
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        department: { select: { name: true } },
        organizer: { select: { firstName: true, lastName: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    const data = events.map((e, index) => ({
      'S.No': index + 1,
      'Title of the Program': e.title,
      'Type': e.type,
      'Organizing Department': e.department?.name || 'Institution Level',
      'Organizer': `${e.organizer.firstName} ${e.organizer.lastName}`,
      'Start Date': new Date(e.startDate).toLocaleDateString(),
      'End Date': new Date(e.endDate).toLocaleDateString(),
      'Venue': e.venue || 'N/A',
      'Budget (₹)': e.budget || 0,
      'Status': e.status
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Events Report');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log the export action
    if (userId) {
      await AuditLogService.logAction({
        action: 'EXPORT',
        entity: 'EVENT_REPORT',
        userId: userId,
        details: { recordsCount: data.length, filters: { departmentId, year } }
      });
    }

    return buffer;
  }
}
