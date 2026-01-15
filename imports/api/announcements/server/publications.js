import { Meteor } from 'meteor/meteor';
import { Announcements } from '../announcements';
import { Roles } from '../../roles/roles';

// Publish active announcements for all users
Meteor.publish('announcements.active', function () {
    const now = new Date();
    return Announcements.find({
        isActive: true,
        startAt: { $lte: now },
        endAt: { $gte: now }
    });
});

// Publish all announcements for admins
Meteor.publish('announcements.all', async function () {
    if (!this.userId) {
        return this.ready();
    }

    if (await Roles.userIsInRoleAsync(this.userId, ['admin', 'support'])) {
        return Announcements.find({}, { sort: { createdAt: -1 } });
    }

    return this.ready();
});
