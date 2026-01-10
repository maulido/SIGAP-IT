import { Meteor } from 'meteor/meteor';
import { PendingReasons } from './pending-reasons';

Meteor.publish('pendingReasons.active', function () {
    if (!this.userId) {
        return this.ready();
    }

    return PendingReasons.find(
        { isActive: true },
        { sort: { reason: 1 } }
    );
});

Meteor.publish('pendingReasons.all', function () {
    if (!this.userId) {
        return this.ready();
    }

    // Only admins can see all pending reasons including inactive ones
    const user = Meteor.users.findOne(this.userId);
    if (!user || !user.roles || !user.roles.includes('admin')) {
        return this.ready();
    }

    return PendingReasons.find({}, { sort: { reason: 1 } });
});
