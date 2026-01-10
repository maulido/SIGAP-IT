import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Worklogs } from './worklogs';

Meteor.publish('worklogs.byTicket', function (ticketId) {
    check(ticketId, String);

    if (!this.userId) {
        return this.ready();
    }

    // Note: Access control is handled by tickets.byId publication
    // If user can see the ticket, they can see worklogs

    return Worklogs.find({ ticketId }, { sort: { createdAt: 1 } });
});
