import cron from 'node-cron';
import { logger } from '../utils/logger';

export function startCronJobs() {
  // Daily backup at 2 AM
  if (process.env.BACKUP_ENABLED === 'true') {
    cron.schedule(process.env.BACKUP_CRON_DAILY || '0 2 * * *', () => {
      logger.info('Running daily backup...');
      // TODO: trigger backup service
    });
  }

  // Clean expired refresh tokens daily
  cron.schedule('0 3 * * *', async () => {
    logger.info('Cleaning expired refresh tokens...');
    // TODO: prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  });

  // Storage usage analytics hourly
  cron.schedule('0 * * * *', () => {
    logger.debug('Storage analytics update...');
  });

  logger.info('✅ Cron jobs started');
}
