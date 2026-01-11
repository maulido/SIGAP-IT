import { Meteor } from 'meteor/meteor';
import { Tickets } from '../imports/api/tickets/tickets';
import { SLAConfigs } from '../imports/api/sla-configs/sla-configs';
import fs from 'fs';
import path from 'path';

Meteor.startup(async () => {
    console.log('--- SLA VERIFICATION V2 STARTING ---');
    const outputPath = 'd:/Apps/SIGAP-IT2/server/sla_verification_v2.json';

    try {
        const admin = await Meteor.users.findOneAsync({ 'emails.address': 'admin@sigap-it.com' });
        if (!admin) {
            console.log('Admin not found for verification.');
            fs.writeFileSync(outputPath, JSON.stringify({ error: 'Admin not found' }));
            return;
        }

        const createTicket = Meteor.server.method_handlers['tickets.create'];
        const changeStatus = Meteor.server.method_handlers['tickets.changeStatus'];

        // 1. Create Ticket
        console.log('1. Creating Ticket...');
        const createResult = await createTicket.call({ userId: admin._id }, {
            title: 'SLA Test V2',
            description: 'Testing SLA logic V2',
            category: 'Hardware',
            priority: 'Critical',
            location: 'Test Lab'
        });

        const ticketId = createResult.ticketId;
        const ticketAfterCreate = await Tickets.findOneAsync(ticketId);

        // 2. Assign
        console.log('2. Moving to In Progress...');
        await changeStatus.call({ userId: admin._id }, {
            ticketId: ticketId,
            newStatus: 'In Progress',
            worklog: 'Started working',
            timeSpent: 0
        });
        const ticketInProgress = await Tickets.findOneAsync(ticketId);

        // 3. Resolve
        console.log('3. Moving to Resolved...');
        await changeStatus.call({ userId: admin._id }, {
            ticketId: ticketId,
            newStatus: 'Resolved',
            worklog: 'Done',
            timeSpent: 1
        });
        const ticketResolved = await Tickets.findOneAsync(ticketId);

        const results = {
            success: true,
            created: {
                deadlineResponse: ticketAfterCreate.slaResponseDeadline,
                deadlineResolution: ticketAfterCreate.slaResolutionDeadline
            },
            inProgress: {
                respondedAt: ticketInProgress.slaRespondedAt,
                responseTime: ticketInProgress.slaResponseTime
            },
            resolved: {
                resolvedAt: ticketResolved.resolvedAt,
                resolutionTime: ticketResolved.slaResolutionTime
            }
        };

        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log('--- SLA VERIFICATION V2 COMPLETE ---');

    } catch (e) {
        console.error('SLA Verification V2 Error:', e);
        fs.writeFileSync(outputPath, JSON.stringify({ error: e.message, stack: e.stack }));
    }
});
