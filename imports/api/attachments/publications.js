import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Attachments } from './attachments';

Meteor.publish('attachments.byTicket', function (ticketId) {
    check(ticketId, String);

    if (!this.userId) {
        return this.ready();
    }

    // Note: Access control is handled by tickets.byId publication
    // If user can see the ticket, they can see attachments

    return Attachments.find({ ticketId });
});
