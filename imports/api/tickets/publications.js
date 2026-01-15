import { Meteor } from 'meteor/meteor';
import { Tickets } from './tickets';

// Extremely simple publication for testing
Meteor.publish('tickets.byId', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    // No access control - just return the ticket
    return Tickets.find(ticketId);
});

Meteor.publish('tickets.myTickets', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Tickets.find({ reporterId: this.userId });
});

Meteor.publish('tickets.assigned', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Tickets.find({ assignedToId: this.userId });
});

Meteor.publish('tickets.open', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Tickets.find({ status: 'Open' });
});

Meteor.publish('tickets.all', function (filters = {}) {
    if (!this.userId) {
        return this.ready();
    }

    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.priority) {
        query.priority = filters.priority;
    }

    if (filters.category) {
        query.category = filters.category;
    }

    return Tickets.find(query, { sort: { createdAt: -1 }, limit: 100 });
});

// Publication for ticket family (parent and children)
Meteor.publish('tickets.family', async function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    const ticket = await Tickets.findOneAsync(ticketId);
    if (!ticket) {
        return this.ready();
    }

    const ticketIds = [ticketId];

    // Add parent
    if (ticket.parentTicketId) {
        ticketIds.push(ticket.parentTicketId);
    }

    // Add children
    if (ticket.childTicketIds && ticket.childTicketIds.length > 0) {
        ticketIds.push(...ticket.childTicketIds);
    }

    return Tickets.find({ _id: { $in: ticketIds } });
});

// Publish tickets by Asset ID
Meteor.publish('tickets.byAsset', async function (assetId) {
    if (!this.userId) return this.ready();

    // Import Roles from api if needed, or assume global.
    // Using async user check for Meteor 3 compatibility
    const user = await Meteor.users.findOneAsync(this.userId);
    if (user && user.roles && (user.roles.includes('support') || user.roles.includes('admin'))) {
        return Tickets.find({ assetId: assetId }, { sort: { createdAt: -1 } });
    }

    return this.ready();
});
