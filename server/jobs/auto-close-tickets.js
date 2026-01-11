import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';
import { Worklogs } from '../../imports/api/worklogs/worklogs';
import { AuditLogs } from '../../imports/api/audit-logs/audit-logs';

// Auto-Close Tickets Job
// Runs every hour to check for Resolved tickets older than 3 days
Meteor.setInterval(async () => {
    console.log('[Auto-Close] Checking for resolved tickets to close...');

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const ticketsToClose = await Tickets.find({
        status: 'Resolved',
        resolvedAt: { $lte: threeDaysAgo },
    }).fetchAsync();

    console.log(`[Auto-Close] Found ${ticketsToClose.length} tickets to auto-close`);

    for (const ticket of ticketsToClose) {
        try {
            await Tickets.updateAsync(ticket._id, {
                $set: {
                    status: 'Closed',
                    closedAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Create worklog entry
            await Worklogs.insertAsync({
                ticketId: ticket._id,
                userId: 'system',
                fromStatus: 'Resolved',
                toStatus: 'Closed',
                worklog: 'Ticket automatically closed after 3 days of being Resolved without user response.',
                createdAt: new Date(),
            });

            // Log audit
            await AuditLogs.insertAsync({
                userId: 'system',
                action: 'ticket_auto_closed',
                entityType: 'ticket',
                entityId: ticket._id,
                metadata: { ticketNumber: ticket.ticketNumber },
                createdAt: new Date(),
            });

            console.log(`[Auto-Close] Closed ticket ${ticket.ticketNumber}`);

        } catch (error) {
            console.error(`[Auto-Close] Error processing ticket ${ticket.ticketNumber}:`, error);
        }
    }

    if (ticketsToClose.length > 0) {
        console.log(`[Auto-Close] Successfully closed ${ticketsToClose.length} tickets`);
    }
}, 60 * 60 * 1000); // Run every 1 hour

console.log('✅ Auto-close tickets job started (runs every hour)');
