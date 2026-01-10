import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Tickets } from './tickets';
import { Worklogs } from '../worklogs/worklogs';
import { AuditLogs } from '../audit-logs/audit-logs';
import { Roles } from '../roles/roles';
import { PendingReasons } from '../pending-reasons/pending-reasons';
import { calculateSLADeadlines } from './sla-calculator';
import { EmailService } from '../emails/email-service';

// Generate unique ticket number
async function generateTicketNumber() {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    // Find the last ticket number for this year
    const lastTicket = await Tickets.findOneAsync(
        { ticketNumber: { $regex: `^${prefix}` } },
        { sort: { ticketNumber: -1 } }
    );

    let nextNumber = 1;
    if (lastTicket) {
        const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// Check for duplicate tickets
async function checkDuplicates(title, category, location) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const similarTickets = await Tickets.find({
        title: { $regex: title, $options: 'i' },
        category,
        location,
        createdAt: { $gte: sevenDaysAgo },
        status: { $in: ['Open', 'In Progress', 'Pending'] },
    }).fetchAsync();

    return similarTickets;
}

Meteor.methods({
    async 'tickets.create'({ title, description, category, priority, location, attachments = [] }) {
        check(title, String);
        check(description, String);
        check(category, String);
        check(priority, String);
        check(location, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in to create a ticket');
        }

        // Check for duplicates
        const duplicates = await checkDuplicates(title, category, location);

        const ticketNumber = await generateTicketNumber();
        const createdAt = new Date();
        const slaDeadlines = calculateSLADeadlines(createdAt, priority);

        const ticketId = await Tickets.insertAsync({
            ticketNumber,
            title,
            description,
            category,
            priority,
            location,
            status: 'Open',
            reporterId: this.userId,
            attachments,
            ...slaDeadlines,
            slaStatus: 'on-track',
            slaPausedDuration: 0,
            createdAt,
            updatedAt: createdAt,
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'ticket_created',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: { ticketNumber, title, category, priority },
            createdAt: new Date(),
        });

        // Send email notification to IT Support team
        const reporter = await Meteor.users.findOneAsync(this.userId);
        const createdTicket = await Tickets.findOneAsync(ticketId);
        if (reporter && createdTicket) {
            EmailService.sendTicketCreatedEmail(createdTicket, reporter).catch(err => {
                console.error('Error sending ticket created email:', err);
            });
        }

        return { ticketId, ticketNumber, duplicates };
    },

    async 'tickets.assignToSelf'(ticketId) {
        check(ticketId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can assign tickets');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        if (ticket.status !== 'Open') {
            throw new Meteor.Error('invalid-status', 'Only Open tickets can be assigned');
        }

        // Check active ticket limit
        const activeTickets = await Tickets.find({
            assignedToId: this.userId,
            status: 'In Progress',
        }).countAsync();

        const maxActiveTickets = 5; // Configurable
        if (activeTickets >= maxActiveTickets) {
            throw new Meteor.Error('limit-reached', `You already have ${maxActiveTickets} active tickets`);
        }

        await Tickets.updateAsync(ticketId, {
            $set: {
                assignedToId: this.userId,
                status: 'In Progress',
                assignedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Create worklog
        await Worklogs.insertAsync({
            ticketId,
            userId: this.userId,
            fromStatus: 'Open',
            toStatus: 'In Progress',
            worklog: 'Ticket assigned to self and started working',
            createdAt: new Date(),
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'ticket_assigned',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: { ticketNumber: ticket.ticketNumber },
            createdAt: new Date(),
        });

        // Send email notification to reporter
        const reporter = await Meteor.users.findOneAsync(ticket.reporterId);
        const assignee = await Meteor.users.findOneAsync(this.userId);
        const updatedTicket = await Tickets.findOneAsync(ticketId);
        if (reporter && assignee && updatedTicket) {
            EmailService.sendTicketAssignedEmail(updatedTicket, reporter, assignee).catch(err => {
                console.error('Error sending ticket assigned email:', err);
            });
        }

        return true;
    },

    async 'tickets.changeStatus'({ ticketId, newStatus, worklog, timeSpent, pendingReason, pendingNotes, customTimeout }) {
        check(ticketId, String);
        check(newStatus, String);
        check(worklog, String);
        check(pendingReason, Match.Maybe(String));
        check(pendingNotes, Match.Maybe(String));
        check(customTimeout, Match.Maybe(Number));

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can change ticket status');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        if (worklog.length < 10) {
            throw new Meteor.Error('invalid-worklog', 'Worklog must be at least 10 characters');
        }

        const updateData = {
            status: newStatus,
            updatedAt: new Date(),
        };

        // Handle Pending status
        if (newStatus === 'Pending') {
            if (!pendingReason) {
                throw new Meteor.Error('validation-error', 'Pending reason is required');
            }

            // Using hardcoded default timeout of 24h as per implicit requirement or generic default
            // since we removed PendingReasons lookup for now.
            const timeoutHours = customTimeout || 24;
            const pendingTimeout = new Date();
            pendingTimeout.setHours(pendingTimeout.getHours() + timeoutHours);

            updateData.pendingReason = pendingReason;
            // updateData.pendingReasonId = pendingReasonId; // Removed as per new requirement to hardcode strings
            updateData.pendingTimeout = pendingTimeout;
            updateData.pendingStartedAt = new Date(); // KF-15
            updateData.pendingSetAt = new Date();
            updateData.pendingSetBy = this.userId;
            updateData.pendingNotes = pendingNotes || '';
        } else {
            // Clear pending fields when moving out of Pending status
            updateData.pendingReason = null;
            updateData.pendingReasonId = null;
            updateData.pendingTimeout = null;
            updateData.pendingStartedAt = null;
            updateData.pendingSetAt = null;
            updateData.pendingSetBy = null;
            updateData.pendingNotes = null;
            updateData.lastReminderSentAt = null;
        }

        if (newStatus === 'Resolved') {
            updateData.resolvedAt = new Date();
        } else if (newStatus === 'Closed') {
            updateData.closedAt = new Date();
        }

        // SLA Tracking
        const { calculateActualTime, getSLAConfig } = await import('./sla-calculator.js');
        const oldStatus = ticket.status;
        const now = new Date();

        // Track response time when moving to In Progress
        if (newStatus === 'In Progress' && oldStatus === 'Open' && !ticket.slaResponseTime) {
            const responseTime = calculateActualTime(
                ticket.createdAt,
                now,
                ticket.slaPausedDuration || 0
            );
            const slaConfig = getSLAConfig(ticket.priority);
            updateData.slaResponseTime = responseTime;
            updateData.slaResponseMet = responseTime <= slaConfig.response;
        }

        // Start SLA pause when moving to Pending
        if (newStatus === 'Pending') {
            updateData.slaPausedAt = now;
        }

        // End SLA pause when moving from Pending
        if (oldStatus === 'Pending' && newStatus !== 'Pending' && ticket.slaPausedAt) {
            const pausedDuration = ticket.slaPausedDuration || 0;
            const additionalPause = (now - ticket.slaPausedAt) / (1000 * 60 * 60);
            updateData.slaPausedDuration = pausedDuration + additionalPause;
            updateData.slaPausedAt = null;
        }

        // Track resolution time when moving to Resolved
        if (newStatus === 'Resolved' && !ticket.slaResolutionTime) {
            const resolutionTime = calculateActualTime(
                ticket.createdAt,
                now,
                updateData.slaPausedDuration || ticket.slaPausedDuration || 0
            );
            const slaConfig = getSLAConfig(ticket.priority);
            updateData.slaResolutionTime = resolutionTime;
            updateData.slaResolutionMet = resolutionTime <= slaConfig.resolution;
        }

        await Tickets.updateAsync(ticketId, { $set: updateData });

        // Create worklog
        const worklogData = {
            ticketId,
            userId: this.userId,
            fromStatus: ticket.status,
            toStatus: newStatus,
            worklog,
            timeSpent: timeSpent || 0,
            createdAt: new Date(),
        };

        if (newStatus === 'Pending' && updateData.pendingReason) {
            worklogData.pendingReason = updateData.pendingReason;
            worklogData.pendingNotes = updateData.pendingNotes;
        }

        await Worklogs.insertAsync(worklogData);

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'status_changed',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: {
                ticketNumber: ticket.ticketNumber,
                fromStatus: ticket.status,
                toStatus: newStatus,
                pendingReason: newStatus === 'Pending' ? updateData.pendingReason : undefined,
            },
            createdAt: new Date(),
        });

        // Send email notification for status change
        const reporter = await Meteor.users.findOneAsync(ticket.reporterId);
        const changedBy = await Meteor.users.findOneAsync(this.userId);
        const updatedTicket = await Tickets.findOneAsync(ticketId);
        if (reporter && changedBy && updatedTicket) {
            EmailService.sendStatusChangedEmail(updatedTicket, reporter, ticket.status, newStatus, changedBy).catch(err => {
                console.error('Error sending status changed email:', err);
            });
        }

        // Send resolved email if status is Resolved
        if (newStatus === 'Resolved' && reporter && changedBy && updatedTicket) {
            EmailService.sendTicketResolvedEmail(updatedTicket, reporter, changedBy).catch(err => {
                console.error('Error sending ticket resolved email:', err);
            });
        }

        return true;
    },

    async 'tickets.checkDuplicates'({ title, category, location }) {
        check(title, String);
        check(category, String);
        check(location, String);

        return await checkDuplicates(title, category, location);
    },

    async 'tickets.reopen'({ ticketId, reason }) {
        check(ticketId, String);
        check(reason, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Only ticket reporter can reopen
        if (ticket.reporterId !== this.userId) {
            throw new Meteor.Error('not-authorized', 'Only the ticket reporter can reopen');
        }

        // Can only reopen Resolved or Closed tickets
        if (!['Resolved', 'Closed'].includes(ticket.status)) {
            throw new Meteor.Error('invalid-status', 'Only Resolved or Closed tickets can be reopened');
        }

        // Check time limit (7 days)
        const statusChangeDate = ticket.resolvedAt || ticket.closedAt;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (statusChangeDate < sevenDaysAgo) {
            throw new Meteor.Error('time-expired', 'Ticket can only be reopened within 7 days');
        }

        if (reason.length < 10) {
            throw new Meteor.Error('invalid-reason', 'Reason must be at least 10 characters');
        }

        await Tickets.updateAsync(ticketId, {
            $set: {
                status: 'Open',
                assignedToId: null,
                updatedAt: new Date(),
            },
            $unset: {
                resolvedAt: '',
                closedAt: '',
            },
        });

        // Create worklog
        await Worklogs.insertAsync({
            ticketId,
            userId: this.userId,
            fromStatus: ticket.status,
            toStatus: 'Open',
            worklog: `Ticket reopened. Reason: ${reason}`,
            createdAt: new Date(),
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'ticket_reopened',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: { ticketNumber: ticket.ticketNumber, reason },
            createdAt: new Date(),
        });

        return true;
    },

    async 'tickets.linkAsChild'({ parentTicketId, childTicketId }) {
        check(parentTicketId, String);
        check(childTicketId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can link tickets');
        }

        const parentTicket = await Tickets.findOneAsync(parentTicketId);
        const childTicket = await Tickets.findOneAsync(childTicketId);

        if (!parentTicket || !childTicket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Prevent circular references
        if (parentTicketId === childTicketId) {
            throw new Meteor.Error('invalid-link', 'Cannot link ticket to itself');
        }

        // Prevent linking if child already has a parent
        if (childTicket.parentTicketId) {
            throw new Meteor.Error('already-linked', 'Child ticket already has a parent');
        }

        // Prevent linking if parent is already a child
        if (parentTicket.parentTicketId) {
            throw new Meteor.Error('invalid-link', 'Parent ticket is already a child of another ticket');
        }

        // Update child ticket
        await Tickets.updateAsync(childTicketId, {
            $set: {
                parentTicketId,
                parentTicketNumber: parentTicket.ticketNumber,
                updatedAt: new Date(),
            },
        });

        // Update parent ticket
        await Tickets.updateAsync(parentTicketId, {
            $addToSet: { childTicketIds: childTicketId },
            $set: {
                hasChildren: true,
                updatedAt: new Date(),
            },
        });

        // Create worklog for both tickets
        await Worklogs.insertAsync({
            ticketId: childTicketId,
            userId: this.userId,
            fromStatus: childTicket.status,
            toStatus: childTicket.status,
            worklog: `Linked as child of ticket ${parentTicket.ticketNumber}`,
            createdAt: new Date(),
        });

        await Worklogs.insertAsync({
            ticketId: parentTicketId,
            userId: this.userId,
            fromStatus: parentTicket.status,
            toStatus: parentTicket.status,
            worklog: `Added child ticket ${childTicket.ticketNumber}`,
            createdAt: new Date(),
        });

        return { success: true };
    },

    async 'tickets.unlinkChild'({ parentTicketId, childTicketId }) {
        check(parentTicketId, String);
        check(childTicketId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can unlink tickets');
        }

        const parentTicket = await Tickets.findOneAsync(parentTicketId);
        const childTicket = await Tickets.findOneAsync(childTicketId);

        if (!parentTicket || !childTicket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Update child ticket
        await Tickets.updateAsync(childTicketId, {
            $unset: {
                parentTicketId: '',
                parentTicketNumber: '',
            },
            $set: {
                updatedAt: new Date(),
            },
        });

        // Update parent ticket
        await Tickets.updateAsync(parentTicketId, {
            $pull: { childTicketIds: childTicketId },
            $set: {
                updatedAt: new Date(),
            },
        });

        // Check if parent still has children
        const updatedParent = await Tickets.findOneAsync(parentTicketId);
        if (!updatedParent.childTicketIds || updatedParent.childTicketIds.length === 0) {
            await Tickets.updateAsync(parentTicketId, {
                $set: { hasChildren: false },
            });
        }

        // Create worklog entries
        await Worklogs.insertAsync({
            ticketId: childTicketId,
            userId: this.userId,
            fromStatus: childTicket.status,
            toStatus: childTicket.status,
            worklog: `Unlinked from parent ticket ${parentTicket.ticketNumber}`,
            createdAt: new Date(),
        });

        await Worklogs.insertAsync({
            ticketId: parentTicketId,
            userId: this.userId,
            fromStatus: parentTicket.status,
            toStatus: parentTicket.status,
            worklog: `Removed child ticket ${childTicket.ticketNumber}`,
            createdAt: new Date(),
        });

        return { success: true };
    },

    async 'tickets.searchByNumber'(ticketNumber) {
        check(ticketNumber, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const ticket = await Tickets.findOneAsync({
            ticketNumber: ticketNumber.toUpperCase()
        });

        if (!ticket) {
            return null;
        }

        return {
            _id: ticket._id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
        };
    },
});
