import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';
import { Worklogs } from '../../imports/api/worklogs/worklogs';
import { Notifications } from '../../imports/api/notifications/notifications';
import { EmailService } from '../../imports/api/emails/email-service';

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

            // Notify Reporter
            const reporter = await Meteor.users.findOneAsync(ticket.reporterId);
            const systemUser = {
                _id: 'system',
                profile: { fullName: 'System (Auto-Timeout)' },
                emails: [{ address: 'no-reply@sigap-it.com' }]
            };

            if (reporter) {
                // Email
                await EmailService.sendStatusChangedEmail(
                    ticket,
                    reporter,
                    'Pending',
                    previousStatus,
                    systemUser
                );

                // In-App Notification
                await Notifications.insertAsync({
                    userId: reporter._id,
                    type: 'warning',
                    title: 'Ticket Reopened (Timeout)',
                    message: `Ticket #${ticket.ticketNumber} has been automatically reopened due to pending timeout.`,
                    link: `/tickets/${ticket._id}`,
                    isRead: false,
                    createdAt: new Date()
                });
            }

            // Notify Assignee (if exists)
            if (ticket.assignedToId) {
                const assignee = await Meteor.users.findOneAsync(ticket.assignedToId);
                if (assignee) {
                    // Email (Assignee receives via sendStatusChangedEmail if explicitly handled, 
                    // but the service might send to reporter only. Let's check EmailService.
                    // EmailService.sendStatusChangedEmail triggers notification to assignee internally 
                    // if ticket.assignedToId is set and different from reporter/changer.
                    // So calling it once above might be enough for email, but let's be safe/explicit if needed.
                    // Actually, looking at EmailService implementation:
                    // It sends to reporter. Then checks if (assignedToId && assignedToId != reporter && assignedToId != changedBy) -> sends to assignee.
                    // So the single call above covers both IF the conditions are met.

                    // In-App Notification for Assignee
                    await Notifications.insertAsync({
                        userId: assignee._id,
                        type: 'warning',
                        title: 'Ticket Reopened (Timeout)',
                        message: `Ticket #${ticket.ticketNumber} assigned to you has revisited Open status due to timeout.`,
                        link: `/tickets/${ticket._id}`,
                        isRead: false,
                        createdAt: new Date()
                    });
                }
            }
        } catch (error) {
            console.error(`[Pending Timeout] Error processing ticket ${ticket.ticketNumber}:`, error);
        }
    }

    if (expiredTickets.length > 0) {
        console.log(`[Pending Timeout] Successfully processed ${expiredTickets.length} expired tickets`);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

console.log('✅ Pending timeout monitoring job started (runs every 15 minutes)');
