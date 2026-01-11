import { Meteor } from 'meteor/meteor';
import { Tickets } from '../imports/api/tickets/tickets';
import { SLAConfigs } from '../imports/api/sla-configs/sla-configs';
import fs from 'fs';
import path from 'path';

Meteor.startup(async () => {
    // Only run if specifically enabled or we can just run it once and check if result file exists (to avoid re-running)
    // For this session, we want it to run.
    console.log('--- SLA VERIFICATION STARTING ---');

    try {
        const admin = await Meteor.users.findOneAsync({ 'emails.address': 'admin@sigap-it.com' });
        if (!admin) {
            console.log('Admin not found for verification.');
            return;
        }

        // Clean up previous test tickets to avoid clutter?
        // await Tickets.removeAsync({ title: 'SLA Test Ticket' });

        const createTicket = Meteor.server.method_handlers['tickets.create'];
        const changeStatus = Meteor.server.method_handlers['tickets.changeStatus'];

        // 1. Create Ticket
        console.log('1. Creating Ticket...');
        const createResult = await createTicket.call({ userId: admin._id }, {
            title: 'SLA Test Ticket',
            description: 'Testing SLA logic',
            category: 'Hardware',
            priority: 'Critical', // Should have 1h response, 4h resolution
            location: 'Test Lab'
        });

        const ticketId = createResult.ticketId;
        const ticketAfterCreate = await Tickets.findOneAsync(ticketId);

        // Check Config
        const slaConfig = await SLAConfigs.findOneAsync({ priority: 'Critical' });

        // 2. Assign (In Progress)
        console.log('2. Moving to In Progress...');
        await changeStatus.call({ userId: admin._id }, {
            ticketId: ticketId,
            newStatus: 'In Progress',
            worklog: 'Started working on SLA test',
            timeSpent: 0
        });

        const ticketInProgress = await Tickets.findOneAsync(ticketId);

        // 3. Resolve
        console.log('3. Moving to Resolved...');
        await changeStatus.call({ userId: admin._id }, {
            ticketId: ticketId,
            newStatus: 'Resolved',
            worklog: 'Resolved SLA test',
            timeSpent: 1
        });

        const ticketResolved = await Tickets.findOneAsync(ticketId);

        const results = {
            success: true,
            ticketId,
            slaConfig: {
                priority: slaConfig.priority,
                response: slaConfig.responseTime,
                resolution: slaConfig.resolutionTime
            },
            created: {
                createdAt: ticketAfterCreate.createdAt,
                slaResponseDeadline: ticketAfterCreate.slaResponseDeadline,
                slaResolutionDeadline: ticketAfterCreate.slaResolutionDeadline,
            },
            inProgress: {
                slaResponseTime: ticketInProgress.slaResponseTime,
                slaRespondedAt: ticketInProgress.slaRespondedAt,
                slaResponseMet: ticketInProgress.slaResponseMet
            },
            resolved: {
                slaResolutionTime: ticketResolved.slaResolutionTime,
                slaResolutionMet: ticketResolved.slaResolutionMet
            }
        };

        const filePath = path.join(process.env.PWD, 'server', 'sla_verification_results.json');
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
        console.log('--- SLA VERIFICATION COMPLETE. Results written to', filePath);

    } catch (e) {
        console.error('SLA Verification Error:', e);
        const filePath = path.join(process.env.PWD, 'server', 'sla_verification_error.json');
        fs.writeFileSync(filePath, JSON.stringify({ error: e.message, stack: e.stack }, null, 2));
    }
});
