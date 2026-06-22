import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── College ────────────────────────────────────────────
  const college = await prisma.college.upsert({
    where: { id: 'college_default' },
    update: {},
    create: {
      id: 'college_default',
      name: process.env.COLLEGE_NAME || 'Your College Name',
      shortName: process.env.COLLEGE_SHORT_NAME || 'YCN',
      address: process.env.COLLEGE_ADDRESS || 'College Address, City, State',
      phone: process.env.COLLEGE_PHONE || '+91-0000000000',
      email: process.env.COLLEGE_EMAIL || 'info@college.edu',
      website: process.env.COLLEGE_WEBSITE || 'https://college.edu',
      accreditation: 'NAAC A++',
      established: 2000,
      principalName: 'Dr. Principal Name',
    },
  });
  console.log('✅ College created:', college.name);

  // ── Departments ────────────────────────────────────────
  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering', shortName: 'CSE' },
    { code: 'ECE', name: 'Electronics & Communication Engineering', shortName: 'ECE' },
    { code: 'MECH', name: 'Mechanical Engineering', shortName: 'MECH' },
    { code: 'CIVIL', name: 'Civil Engineering', shortName: 'CIVIL' },
    { code: 'EEE', name: 'Electrical & Electronics Engineering', shortName: 'EEE' },
    { code: 'IT', name: 'Information Technology', shortName: 'IT' },
    { code: 'MBA', name: 'Master of Business Administration', shortName: 'MBA' },
    { code: 'MCA', name: 'Master of Computer Applications', shortName: 'MCA' },
    { code: 'ADMIN', name: 'Administration', shortName: 'ADMIN' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        ...dept,
        collegeId: college.id,
        vision: `To be a center of excellence in ${dept.name}`,
        mission: `Imparting quality education and training in ${dept.name}`,
      },
    });
  }
  console.log('✅ Departments seeded:', departments.length);

  // ── Permissions ────────────────────────────────────────
  const permissions = [
    // Users
    { name: 'users:create', displayName: 'Create Users', module: 'users', action: 'create' },
    { name: 'users:read', displayName: 'View Users', module: 'users', action: 'read' },
    { name: 'users:update', displayName: 'Edit Users', module: 'users', action: 'update' },
    { name: 'users:delete', displayName: 'Delete Users', module: 'users', action: 'delete' },
    // Departments
    { name: 'departments:create', displayName: 'Create Departments', module: 'departments', action: 'create' },
    { name: 'departments:read', displayName: 'View Departments', module: 'departments', action: 'read' },
    { name: 'departments:update', displayName: 'Edit Departments', module: 'departments', action: 'update' },
    { name: 'departments:delete', displayName: 'Delete Departments', module: 'departments', action: 'delete' },
    // Faculty
    { name: 'faculty:create', displayName: 'Add Faculty', module: 'faculty', action: 'create' },
    { name: 'faculty:read', displayName: 'View Faculty', module: 'faculty', action: 'read' },
    { name: 'faculty:update', displayName: 'Edit Faculty', module: 'faculty', action: 'update' },
    { name: 'faculty:delete', displayName: 'Delete Faculty', module: 'faculty', action: 'delete' },
    // Students
    { name: 'students:create', displayName: 'Add Students', module: 'students', action: 'create' },
    { name: 'students:read', displayName: 'View Students', module: 'students', action: 'read' },
    { name: 'students:update', displayName: 'Edit Students', module: 'students', action: 'update' },
    { name: 'students:delete', displayName: 'Delete Students', module: 'students', action: 'delete' },
    // Documents
    { name: 'documents:create', displayName: 'Generate Documents', module: 'documents', action: 'create' },
    { name: 'documents:read', displayName: 'View Documents', module: 'documents', action: 'read' },
    { name: 'documents:delete', displayName: 'Delete Documents', module: 'documents', action: 'delete' },
    { name: 'documents:download', displayName: 'Download Documents', module: 'documents', action: 'download' },
    // Files
    { name: 'files:upload', displayName: 'Upload Files', module: 'files', action: 'upload' },
    { name: 'files:read', displayName: 'View Files', module: 'files', action: 'read' },
    { name: 'files:delete', displayName: 'Delete Files', module: 'files', action: 'delete' },
    // Templates
    { name: 'templates:create', displayName: 'Create Templates', module: 'templates', action: 'create' },
    { name: 'templates:read', displayName: 'View Templates', module: 'templates', action: 'read' },
    { name: 'templates:update', displayName: 'Edit Templates', module: 'templates', action: 'update' },
    { name: 'templates:delete', displayName: 'Delete Templates', module: 'templates', action: 'delete' },
    // Events
    { name: 'events:create', displayName: 'Create Events', module: 'events', action: 'create' },
    { name: 'events:read', displayName: 'View Events', module: 'events', action: 'read' },
    { name: 'events:update', displayName: 'Edit Events', module: 'events', action: 'update' },
    { name: 'events:delete', displayName: 'Delete Events', module: 'events', action: 'delete' },
    // Approvals
    { name: 'approvals:request', displayName: 'Request Approvals', module: 'approvals', action: 'request' },
    { name: 'approvals:review', displayName: 'Review Approvals', module: 'approvals', action: 'review' },
    { name: 'approvals:manage', displayName: 'Manage Workflows', module: 'approvals', action: 'manage' },
    // Reports
    { name: 'reports:generate', displayName: 'Generate Reports', module: 'reports', action: 'generate' },
    { name: 'reports:read', displayName: 'View Reports', module: 'reports', action: 'read' },
    // Settings
    { name: 'settings:manage', displayName: 'Manage Settings', module: 'settings', action: 'manage' },
    // Inventory
    { name: 'inventory:manage', displayName: 'Manage Inventory', module: 'inventory', action: 'manage' },
    { name: 'inventory:read', displayName: 'View Inventory', module: 'inventory', action: 'read' },
    // Logs
    { name: 'logs:read', displayName: 'View Logs', module: 'logs', action: 'read' },
    // Backup
    { name: 'backup:manage', displayName: 'Manage Backups', module: 'backup', action: 'manage' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions seeded:', permissions.length);

  // ── Super Admin User ────────────────────────────────────
  const hashedPassword = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
    12
  );

  const superAdmin = await prisma.user.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@cddas.edu' },
    update: {},
    create: {
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@cddas.edu',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      collegeId: college.id,
      isEmailVerified: true,
      isActive: true,
      designation: 'System Administrator',
      employeeId: 'SA-001',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // ── Default System Settings ────────────────────────────
  const settings = [
    { key: 'theme_mode', value: 'light', type: 'string', group: 'appearance', label: 'Theme Mode', isPublic: true },
    { key: 'primary_color', value: '#1565C0', type: 'string', group: 'appearance', label: 'Primary Color', isPublic: true },
    { key: 'sidebar_collapsed', value: 'false', type: 'boolean', group: 'appearance', label: 'Sidebar Collapsed' },
    { key: 'pagination_size', value: '25', type: 'number', group: 'general', label: 'Default Page Size' },
    { key: 'date_format', value: 'DD/MM/YYYY', type: 'string', group: 'general', label: 'Date Format', isPublic: true },
    { key: 'currency', value: 'INR', type: 'string', group: 'general', label: 'Currency', isPublic: true },
    { key: 'academic_year_current', value: '2025-26', type: 'string', group: 'academic', label: 'Current Academic Year', isPublic: true },
    { key: 'email_notifications', value: 'true', type: 'boolean', group: 'notifications', label: 'Email Notifications' },
    { key: 'session_timeout', value: '60', type: 'number', group: 'security', label: 'Session Timeout (minutes)' },
    { key: 'max_upload_size_mb', value: '50', type: 'number', group: 'storage', label: 'Max Upload Size (MB)' },
    { key: 'watermark_enabled', value: 'false', type: 'boolean', group: 'documents', label: 'Watermark on Documents' },
    { key: 'qr_code_on_docs', value: 'true', type: 'boolean', group: 'documents', label: 'QR Code on Documents', isPublic: true },
    { key: 'backup_enabled', value: 'true', type: 'boolean', group: 'backup', label: 'Auto Backup Enabled' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { collegeId_key: { collegeId: college.id, key: setting.key } },
      update: {},
      create: { ...setting, collegeId: college.id, isPublic: setting.isPublic || false },
    });
  }
  console.log('✅ System settings seeded:', settings.length);

  // ── Default Approval Workflow ──────────────────────────
  await prisma.approvalWorkflow.upsert({
    where: { id: 'wf_standard' },
    update: {},
    create: {
      id: 'wf_standard',
      name: 'Standard Document Approval',
      description: 'Faculty → HOD → Principal → Management',
      module: 'documents',
      steps: [
        { step: 1, role: 'HOD', label: 'HOD Approval', required: true },
        { step: 2, role: 'SUPER_ADMIN', label: 'Principal Approval', required: true },
        { step: 3, role: 'SUPER_ADMIN', label: 'Management Approval', required: false },
      ],
      isActive: true,
    },
  });
  console.log('✅ Default approval workflow created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('─'.repeat(40));
  console.log(`📧 Super Admin Email: ${superAdmin.email}`);
  console.log(`🔑 Password: ${process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456'}`);
  console.log('─'.repeat(40));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
