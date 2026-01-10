import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';
import { getSLAStatus } from '../../imports/api/tickets/sla-calculator';

// SLA Monitoring Job
// Runs every 15 minutes to update SLA status for active tickets
Meteor.setInterval(async () => {
    console.log('[SLA Monitor] Checking SLA status...');

    const now = new Date();
    const activeTickets = await Tickets.find({
        status: { $in: ['Open', 'In Progress', 'Pending'] },
    }).fetchAsync();

    let updated = 0;

    for (const ticket of activeTickets) {
        try {
            // Skip if paused (Pending status)
            if (ticket.status === 'Pending') {
                continue;
            }

            let newStatus = ticket.slaStatus;

            // Check response SLA if not yet responded
            if (!ticket.slaResponseTime && ticket.slaResponseDeadline) {
                const responseStatus = getSLAStatus(ticket.slaResponseDeadline, now);
                newStatus = responseStatus;
            }
            // Check resolution SLA if responded but not resolved
            else if (ticket.slaResponseTime && !ticket.slaResolutionTime && ticket.slaResolutionDeadline) {
                const resolutionStatus = getSLAStatus(ticket.slaResolutionDeadline, now);
                newStatus = resolutionStatus;
            }

            // Update if status changed
            if (newStatus && ticket.slaStatus !== newStatus) {
                await Tickets.updateAsync(ticket._id, {
                    $set: { slaStatus: newStatus },
                });
                updated++;

                if (newStatus === 'breached') {
                    console.log(`[SLA Monitor] ⚠️ SLA BREACHED: ${ticket.ticketNumber}`);
                } else if (newStatus === 'at-risk') {
                    console.log(`[SLA Monitor] ⏰ SLA AT RISK: ${ticket.ticketNumber}`);
                }
            }
        } catch (error) {
            console.error(`[SLA Monitor] Error processing ticket ${ticket.ticketNumber}:`, error);
        }
    }

    if (updated > 0) {
        console.log(`[SLA Monitor] Updated ${updated} ticket(s)`);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

console.log('✅ SLA monitoring job started (runs every 15 minutes)');
