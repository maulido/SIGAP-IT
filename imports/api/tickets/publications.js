import { Meteor } from 'meteor/meteor';
import { Tickets } from './tickets';
import { Worklogs } from '../worklogs/worklogs';
import { Comments } from '../comments/comments';
import { Roles } from '../roles/roles';

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

    if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
        return this.ready();
    }

    return Tickets.find({ assignedToId: this.userId });
});

Meteor.publish('tickets.open', function () {
    if (!this.userId) {
        return this.ready();
    }

    if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
        return this.ready();
    }

    return Tickets.find({ status: 'Open' });
});

Meteor.publish('tickets.all', function (filters = {}) {
    if (!this.userId) {
        return this.ready();
    }

    if (!Roles.userIsInRole(this.userId, ['admin'])) {
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

Meteor.publish('tickets.byId', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    const ticket = Tickets.findOne(ticketId);

    if (!ticket) {
        return this.ready();
    }

    // Users can only see their own tickets unless they are support/admin
    const canView =
        ticket.reporterId === this.userId ||
        ticket.assignedToId === this.userId ||
        Roles.userIsInRole(this.userId, ['support', 'admin']);

    if (!canView) {
        return this.ready();
    }

    return [
        Tickets.find(ticketId),
        Worklogs.find({ ticketId }),
        Comments.find({ ticketId }),
    ];
});

Meteor.publish('worklogs.byTicket', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    return Worklogs.find({ ticketId }, { sort: { createdAt: 1 } });
});

Meteor.publish('comments.byTicket', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    const query = { ticketId };

    // Regular users can't see internal comments
    if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
        query.isInternal = false;
    }

    return Comments.find(query, { sort: { createdAt: 1 } });
});
