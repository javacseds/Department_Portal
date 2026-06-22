import { prisma } from '@cddas/database';

export class SettingService {
  static async getAll(isPublicOnly: boolean = false) {
    return prisma.systemSetting.findMany({
      where: isPublicOnly ? { isPublic: true } : undefined,
      orderBy: { key: 'asc' }
    });
  }

  static async getByKey(key: string) {
    return prisma.systemSetting.findFirst({
      where: { key }
    });
  }

  static async bulkUpdate(settings: Array<{ key: string; value: string; isPublic?: boolean }>, userId: string) {
    const defaultCollege = await prisma.college.findFirst();
    const collegeId = defaultCollege?.id;
    
    for (const setting of settings) {
        const existing = await prisma.systemSetting.findFirst({ where: { key: setting.key, collegeId } });
        if (existing) {
            await prisma.systemSetting.update({
                where: { id: existing.id },
                data: {
                    value: setting.value,
                    ...(setting.isPublic !== undefined && { isPublic: setting.isPublic })
                }
            });
        } else {
            await prisma.systemSetting.create({
                data: {
                    collegeId,
                    key: setting.key,
                    value: setting.value,
                    type: 'string',
                    group: 'General',
                    label: setting.key,
                    isPublic: setting.isPublic ?? false,
                    description: `Custom setting for ${setting.key}`
                }
            });
        }
    }
    
    return this.getAll();
  }
}
