import { Meteor } from 'meteor/meteor';
import { Escalations } from './escalations';

Meteor.publish('escalations.byTicket', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    return Escalations.find({ ticketId }, { sort: { escalatedAt: -1 } });
});

Meteor.publish('escalations.unacknowledged', function () {
    if (!this.userId) {
        return this.ready();
    }

    // Only admins and support can view escalations
    const user = Meteor.users.findOne(this.userId);
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
        return this.ready();
    }

    return Escalations.find(
        { acknowledged: false },
        { sort: { escalatedAt: -1 }, limit: 50 }
    );
});

Meteor.publish('escalations.recent', function (limit = 20) {
    if (!this.userId) {
        return this.ready();
    }

    // Only admins and support can view escalations
    const user = Meteor.users.findOne(this.userId);
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
        return this.ready();
    }

    return Escalations.find(
        {},
        { sort: { escalatedAt: -1 }, limit }
    );
});
