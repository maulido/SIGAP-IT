import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Tickets } from './tickets';
import { Worklogs } from '../worklogs/worklogs';
import { AuditLogs } from '../audit-logs/audit-logs';
import { Roles } from '../roles/roles';

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
            createdAt: new Date(),
            updatedAt: new Date(),
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

        return true;
    },

    async 'tickets.changeStatus'({ ticketId, newStatus, worklog, timeSpent }) {
        check(ticketId, String);
        check(newStatus, String);
        check(worklog, String);

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

        if (newStatus === 'Resolved') {
            updateData.resolvedAt = new Date();
        } else if (newStatus === 'Closed') {
            updateData.closedAt = new Date();
        }

        await Tickets.updateAsync(ticketId, { $set: updateData });

        // Create worklog
        await Worklogs.insertAsync({
            ticketId,
            userId: this.userId,
            fromStatus: ticket.status,
            toStatus: newStatus,
            worklog,
            timeSpent: timeSpent || 0,
            createdAt: new Date(),
        });

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
            },
            createdAt: new Date(),
        });

        return true;
    },

    async 'tickets.checkDuplicates'({ title, category, location }) {
        check(title, String);
        check(category, String);
        check(location, String);

        return await checkDuplicates(title, category, location);
    },
});
