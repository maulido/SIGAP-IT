import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';
import { Worklogs } from '../../imports/api/worklogs/worklogs';

// Pending Timeout Monitoring Job
// Runs every 15 minutes to check for expired pending tickets
Meteor.setInterval(async () => {
    console.log('[Pending Timeout] Checking for expired pending tickets...');

    const now = new Date();
    const expiredTickets = await Tickets.find({
        status: 'Pending',
        pendingTimeout: { $lte: now },
    }).fetchAsync();

    console.log(`[Pending Timeout] Found ${expiredTickets.length} expired tickets`);

    for (const ticket of expiredTickets) {
        try {
            // Change status back to Open (could be configurable)
            const previousStatus = 'Open';

            await Tickets.updateAsync(ticket._id, {
                $set: {
                    status: previousStatus,
                    updatedAt: new Date(),
                },
                $unset: {
                    // Clear pending fields
                    pendingReason: '',
                    pendingReasonId: '',
                    pendingTimeout: '',
                    pendingSetAt: '',
                    pendingSetBy: '',
                    pendingNotes: '',
                },
            });

            // Create worklog entry
            await Worklogs.insertAsync({
                ticketId: ticket._id,
                userId: 'system', // System user for automated actions
                fromStatus: 'Pending',
                toStatus: previousStatus,
                worklog: `Pending timeout expired. Reason was: ${ticket.pendingReason}. Ticket automatically escalated back to ${previousStatus}.`,
                createdAt: new Date(),
            });

            console.log(`[Pending Timeout] Escalated ticket ${ticket.ticketNumber} from Pending to ${previousStatus}`);

            // TODO: Send notification to assigned user and reporter
            // This would require implementing email/notification system
        } catch (error) {
            console.error(`[Pending Timeout] Error processing ticket ${ticket.ticketNumber}:`, error);
        }
    }

    if (expiredTickets.length > 0) {
        console.log(`[Pending Timeout] Successfully processed ${expiredTickets.length} expired tickets`);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

console.log('✅ Pending timeout monitoring job started (runs every 15 minutes)');
