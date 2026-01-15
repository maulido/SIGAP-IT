import 'dotenv/config';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import bcrypt from 'bcryptjs';

// Import collections from modular files
import { Tickets } from '../imports/api/tickets/tickets';
import { Worklogs } from '../imports/api/worklogs/worklogs';
import { Comments } from '../imports/api/comments/comments';
import { Attachments } from '../imports/api/attachments/attachments';
import { SLAConfigs } from '../imports/api/sla-configs/sla-configs';
import { AuditLogs } from '../imports/api/audit-logs/audit-logs';
import { PendingReasons } from '../imports/api/pending-reasons/pending-reasons';
import { Ratings } from '../imports/api/ratings/ratings';
import { KBArticles } from '../imports/api/kb-articles/kb-articles';
import { Escalations } from '../imports/api/escalations/escalations';
import { CategoryConfigs } from '../imports/api/category-configs/category-configs';

// Import custom roles utility
import { Roles } from '../imports/api/roles/roles';

// Import email configuration
import './email-config';

// Import all methods
import '../imports/api/notifications/methods';
import '../imports/api/canned-responses/methods';
import '../imports/api/canned-responses/server/publications';
import '../imports/api/tickets/methods';
import '../imports/api/comments/methods';
import '../imports/api/attachments/methods';
import '../imports/api/users/users';
import '../imports/api/pending-reasons/server';
import '../imports/api/ratings/server';
import '../imports/api/kb-articles/server';
import '../imports/api/dashboard/dashboard-stats';
import '../imports/api/reports/reports-methods';
import '../imports/api/reports/reports-methods';
import '../imports/api/escalations/escalation-methods';
import '../imports/api/announcements/methods';
import '../imports/api/announcements/server/publications';
import '../imports/api/assets/methods';
import '../imports/api/assets/server/publications';

// Import all publications
import '../imports/api/tickets/publications';
import '../imports/api/comments/publications';
import '../imports/api/worklogs/publications';
import '../imports/api/attachments/publications';
import '../imports/api/users/users'; // Contains user publications
import '../imports/api/escalations/publications';
import '../imports/api/notifications/publications';
import '../imports/api/category-configs/server/publications';
import '../imports/api/audit-logs/server/publications';
import '../imports/api/support-data/server/publications';
import '../imports/api/support-data/methods';
import '../imports/api/support-data/support-files';

// Import background jobs
import './jobs/pending-timeout';
import './jobs/sla-monitor';
import './jobs/sla-escalation';
import './jobs/auto-close-tickets';



// KF-32: Audit Trail for Logout
Accounts.onLogout(async (session) => {
  if (session.user) {
    try {
      await AuditLogs.insertAsync({
        userId: session.user._id,
        action: 'logout',
        metadata: { connectionId: session.connection.id },
        createdAt: new Date(),
      });
      // console.log(`User ${session.user._id} logged out`);
    } catch (err) {
      console.error('Error logging logout event:', err);
    }
  }
});

// Password hashing with bcryptjs
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const verifyPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

// Custom login method
Meteor.methods({
  async 'users.login'(email, password) {
    check(email, String);
    check(password, String);

    const user = await Meteor.users.findOneAsync({
      'emails.address': email
    });

    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    if (!user.services?.password?.bcrypt) {
      throw new Meteor.Error('no-password', 'User has no password set');
    }

    if (!verifyPassword(password, user.services.password.bcrypt)) {
      throw new Meteor.Error('incorrect-password', 'Incorrect password');
    }

    if (!user.profile?.isActive) {
      throw new Meteor.Error('account-disabled', 'Account is disabled');
    }

    // Generate login token
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(user._id, stampedLoginToken);

    // Log successful login
    await AuditLogs.insertAsync({
      userId: user._id,
      action: 'login',
      metadata: { method: 'password' },
      createdAt: new Date(),
    });

    return {
      userId: user._id,
      token: stampedLoginToken.token,
    };
  },
});

// Note: tickets.create, tickets.assignToSelf, tickets.changeStatus, comments.add, and user methods
// are now imported from modular files in imports/api/

// Note: All publications (tickets.myTickets, tickets.all, tickets.assigned, tickets.open, tickets.byId,
// comments.byTicket, worklogs.byTicket, users.all, users.active, users.current)
// are now imported from modular files in imports/api/

Meteor.startup(async () => {
  console.log('🚀 SIGAP-IT Server Starting...');

  Accounts.config({
    forbidClientAccountCreation: true,
  });

  // Create default admin user
  const userCount = await Meteor.users.find().countAsync();
  if (userCount === 0) {
    const userId = await Meteor.users.insertAsync({
      emails: [{ address: 'admin@sigap-it.com', verified: true }],
      profile: {
        fullName: 'System Administrator',
        department: 'IT',
        isActive: true,
      },
      services: {
        password: {
          bcrypt: hashPassword('admin123')
        }
      },
      createdAt: new Date(),
      roles: ['admin']
    });

    console.log('✅ Default admin user created');
    console.log('   Email: admin@sigap-it.com');
    console.log('   Password: admin123');
    console.log('   User ID:', userId);
  }

  // Create default SLA configs
  const slaCount = await SLAConfigs.find().countAsync();
  if (slaCount === 0) {
    const slaDefaults = [
      { priority: 'Critical', responseTime: 1, resolutionTime: 4, businessHoursOnly: false, isActive: true, createdAt: new Date() },
      { priority: 'High', responseTime: 2, resolutionTime: 8, businessHoursOnly: true, isActive: true, createdAt: new Date() },
      { priority: 'Medium', responseTime: 4, resolutionTime: 24, businessHoursOnly: true, isActive: true, createdAt: new Date() },
      { priority: 'Low', responseTime: 8, resolutionTime: 48, businessHoursOnly: true, isActive: true, createdAt: new Date() },
    ];

    for (const sla of slaDefaults) {
      await SLAConfigs.insertAsync(sla);
    }
    console.log('✅ Default SLA configurations created');
  }

  // Create default pending reasons
  const pendingReasonsCount = await PendingReasons.find().countAsync();
  if (pendingReasonsCount === 0) {
    const adminUser = await Meteor.users.findOneAsync({ 'emails.address': 'admin@sigap-it.com' });

    const defaultReasons = [
      {
        reason: 'Waiting for User Response',
        description: 'Waiting for additional information from the ticket reporter',
        defaultTimeout: 48,
      },
      {
        reason: 'Waiting for Third Party',
        description: 'Waiting for external vendor or service provider',
        defaultTimeout: 72,
      },
      {
        reason: 'Waiting for Parts/Equipment',
        description: 'Waiting for hardware or equipment to arrive',
        defaultTimeout: 120,
      },
      {
        reason: 'Waiting for Approval',
        description: 'Waiting for management or budget approval',
        defaultTimeout: 24,
      },
      {
        reason: 'Scheduled Maintenance',
        description: 'Scheduled for future maintenance window',
        defaultTimeout: 168,
      },
    ];

    for (const reason of defaultReasons) {
      await PendingReasons.insertAsync({
        ...reason,
        isActive: true,
        createdBy: adminUser._id,
      });
    }

    console.log('✅ Default pending reasons created');
  }

  // Create default Category Configs
  const categoryConfigCount = await CategoryConfigs.find().countAsync();
  if (categoryConfigCount === 0) {
    const categoryDefaults = [
      {
        category: 'Hardware',
        fields: [
          { name: 'assetId', label: 'Asset Tag / Hostname', type: 'text', placeholder: 'e.g., LP-IT-001', required: true },
          { name: 'deviceType', label: 'Device Type', type: 'select', options: ['Laptop', 'Desktop', 'Printer', 'Scanner', 'Other'], required: true },
          { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g., Lenovo ThinkPad T14', required: false }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        category: 'Software',
        fields: [
          { name: 'softwareName', label: 'Software Name', type: 'text', placeholder: 'e.g., Office 365, Adobe Reader', required: true },
          { name: 'version', label: 'Version', type: 'text', placeholder: 'if known', required: false },
          { name: 'impactedUsers', label: 'Impacted Users', type: 'select', options: ['Single User', 'Multiple Users', 'All Users'], required: true }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        category: 'Network',
        fields: [
          { name: 'connectionType', label: 'Connection Type', type: 'select', options: ['WiFi', 'LAN/Cable', 'VPN'], required: true },
          { name: 'locationDetails', label: 'Detailed Location', type: 'text', placeholder: 'e.g., Floor 3 Meeting Room', required: true }
        ],
        isActive: true,
        createdAt: new Date()
      }
    ];

    for (const config of categoryDefaults) {
      await CategoryConfigs.insertAsync(config);
    }
    console.log('✅ Default Category configurations created');
  }



  console.log('✅ SIGAP-IT Server Ready!');
  console.log('📍 Visit http://localhost:3000');

  const ticketCount = await Tickets.find().countAsync();
  const finalUserCount = await Meteor.users.find().countAsync();
  console.log(`📊 Users: ${finalUserCount}, Tickets: ${ticketCount}`);
});

// Import verification script at the end to ensure it runs after seeding
import './verify_support_debug';
import './seed_canned_responses';

