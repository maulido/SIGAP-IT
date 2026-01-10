import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Comments } from './comments';
import { AuditLogs } from '../audit-logs/audit-logs';
import { Tickets } from '../tickets/tickets';
import { Roles } from '../roles/roles';
import { EmailService } from '../emails/email-service';

Meteor.methods({
    async 'comments.add'({ ticketId, content, isInternal = false }) {
        check(ticketId, String);
        check(content, String);
        check(isInternal, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Only support/admin can add internal comments
        if (isInternal && !Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can add internal comments');
        }

        // Check if user has access to this ticket
        const canComment =
            ticket.reporterId === this.userId ||
            ticket.assignedToId === this.userId ||
            Roles.userIsInRole(this.userId, ['support', 'admin']);

        if (!canComment) {
            throw new Meteor.Error('not-authorized', 'You cannot comment on this ticket');
        }

        const commentId = await Comments.insertAsync({
            ticketId,
            userId: this.userId,
            content,
            isInternal,
            createdAt: new Date(),
        });

        // Update ticket's updatedAt
        await Tickets.updateAsync(ticketId, {
            $set: { updatedAt: new Date() },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'comment_added',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: { ticketNumber: ticket.ticketNumber, isInternal },
            createdAt: new Date(),
        });

        // Send email notification for comment (only for non-internal comments)
        if (!isInternal) {
            const commenter = await Meteor.users.findOneAsync(this.userId);
            const comment = await Comments.findOneAsync(commentId);
            if (commenter && comment) {
                EmailService.sendCommentAddedEmail(ticket, comment, commenter).catch(err => {
                    console.error('Error sending comment added email:', err);
                });
            }
        }

        return commentId;
    },
});
