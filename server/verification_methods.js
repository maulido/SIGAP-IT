import { Meteor } from 'meteor/meteor';
import { Tickets } from '../imports/api/tickets/tickets';
import { Escalations } from '../imports/api/escalations/escalations';

Meteor.methods({
    async 'verification.forceEscalate'(ticketId, level = 2) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin')) {
            throw new Meteor.Error('not-authorized', 'Only admins can force escalation');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Create escalation record
        await Escalations.insertAsync({
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            escalationLevel: level,
            escalatedAt: new Date(),
            escalatedBy: 'manual_verification',
            notifiedUsers: [this.userId],
            slaDeadline: new Date(),
            percentageUsed: level === 2 ? 95 : 80,
            acknowledged: false,
            metadata: {
                priority: ticket.priority,
                category: ticket.category,
                assignedTo: ticket.assignedToId,
                status: ticket.status
            },
            createdAt: new Date()
        });

        return 'Escalation created successfully';
    },

    async 'verification.checkSLALogic'() {
        if (!this.userId) throw new Meteor.Error('not-authorized');
        // This is a placeholder to confirm the file is writable and loaded
        return 'SLA Check Ready';
    }
});
