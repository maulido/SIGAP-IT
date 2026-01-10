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
