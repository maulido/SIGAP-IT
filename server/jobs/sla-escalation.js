import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';
import { Escalations } from '../../imports/api/escalations/escalations';
import {
    calculateSLAPercentage,
    shouldEscalate,
    getNotificationRecipients,
    getEscalationLevelName,
    getTimeRemaining
} from '../../imports/api/escalations/escalation-rules';
import { EmailService } from '../../imports/api/emails/email-service';

// Run SLA escalation check every 15 minutes
const ESCALATION_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

async function checkAndEscalateTickets() {
    console.log('[SLA Escalation] Starting escalation check...');

    try {
        // Find all active tickets (not resolved or closed)
        const activeTickets = await Tickets.find({
            status: { $in: ['Open', 'In Progress', 'Pending'] }
        }).fetchAsync();

        console.log(`[SLA Escalation] Checking ${activeTickets.length} active tickets`);

        let escalatedCount = 0;

        for (const ticket of activeTickets) {
            try {
                // Get existing escalations for this ticket
                const existingEscalations = await Escalations.find({
                    ticketId: ticket._id
                }).fetchAsync();

                // Check if escalation is needed
                const escalationCheck = shouldEscalate(ticket, existingEscalations);

                if (escalationCheck.shouldEscalate) {
                    console.log(`[SLA Escalation] Escalating ticket ${ticket.ticketNumber} at ${escalationCheck.percentage}% (Level ${escalationCheck.level})`);

                    // Get notification recipients
                    const recipients = await getNotificationRecipients(ticket, escalationCheck.level);

                    // Determine SLA deadline
                    let slaDeadline;
                    if (!ticket.slaResponseTime && ticket.slaResponseDeadline) {
                        slaDeadline = ticket.slaResponseDeadline;
                    } else if (ticket.slaResolutionDeadline) {
                        slaDeadline = ticket.slaResolutionDeadline;
                    }

                    // Create escalation record
                    const escalationId = await Escalations.insertAsync({
                        ticketId: ticket._id,
                        ticketNumber: ticket.ticketNumber,
                        escalationLevel: escalationCheck.level,
                        escalatedAt: new Date(),
                        escalatedBy: 'system',
                        notifiedUsers: recipients,
                        slaDeadline,
                        percentageUsed: escalationCheck.percentage,
                        acknowledged: false,
                        metadata: {
                            priority: ticket.priority,
                            category: ticket.category,
                            assignedTo: ticket.assignedToId,
                            status: ticket.status
                        },
                        createdAt: new Date()
                    });

                    // Send email notifications
                    if (recipients.length > 0) {
                        const escalation = await Escalations.findOneAsync(escalationId);
                        const timeRemaining = getTimeRemaining(ticket);

                        try {
                            if (escalationCheck.level === 1) {
                                await EmailService.sendSLAWarningEmail(ticket, escalation, recipients, timeRemaining);
                            } else {
                                await EmailService.sendSLACriticalEmail(ticket, escalation, recipients, timeRemaining);
                            }
                            console.log(`[SLA Escalation] Sent ${getEscalationLevelName(escalationCheck.level)} notification to ${recipients.length} users`);
                        } catch (emailError) {
                            console.error(`[SLA Escalation] Failed to send email for ticket ${ticket.ticketNumber}:`, emailError);
                        }
                    }

                    escalatedCount++;
                }
            } catch (ticketError) {
                console.error(`[SLA Escalation] Error processing ticket ${ticket.ticketNumber}:`, ticketError);
            }
        }

        console.log(`[SLA Escalation] Check complete. Escalated ${escalatedCount} tickets.`);
    } catch (error) {
        console.error('[SLA Escalation] Error in escalation check:', error);
    }
}

// Start the escalation monitoring job
Meteor.startup(() => {
    console.log('[SLA Escalation] Starting SLA escalation monitoring job...');

    // Run immediately on startup
    Meteor.setTimeout(() => {
        checkAndEscalateTickets();
    }, 30000); // Wait 30 seconds after startup

    // Then run every 15 minutes
    Meteor.setInterval(() => {
        checkAndEscalateTickets();
    }, ESCALATION_INTERVAL);

    console.log('[SLA Escalation] Job scheduled to run every 15 minutes');
});
