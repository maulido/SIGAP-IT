import { Meteor } from 'meteor/meteor';
import { CannedResponses } from '../canned-responses';
import { Roles } from '../../roles/roles';

Meteor.publish('cannedResponses.all', function () {
    if (!this.userId) {
        return this.ready();
    }

    // Only allow support and admin to see for now (or all users if self-service uses it too?)
    // For now, let's allow logged-in users to see them if we want to use them in the future for smart replies
    // But requirement says Support Agents.
    if (Roles.userIsInRole(this.userId, ['support', 'admin'])) {
        return CannedResponses.find({}, { sort: { title: 1 } });
    }

    return this.ready();
});
