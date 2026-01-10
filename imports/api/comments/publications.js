import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Comments } from './comments';

Meteor.publish('comments.byTicket', function (ticketId) {
    check(ticketId, String);

    if (!this.userId) {
        return this.ready();
    }

    // Simple publication - just return comments for this ticket
    return Comments.find({ ticketId }, { sort: { createdAt: 1 } });
});
