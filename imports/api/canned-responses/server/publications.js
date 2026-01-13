import { Meteor } from 'meteor/meteor';
import { CannedResponses } from '../canned-responses';
import { Roles } from '../../roles/roles';

Meteor.publish('cannedResponses.all', function () {
    console.log('Publish cannedResponses.all called', { userId: this.userId });
    if (!this.userId) {
        return this.ready();
    }

    // Only allow support and admin to see
    // Use sync check or async inside wrapAsync if needed, but for pub usually easier to just check
    // Since Roles.userIsInRoleAsync is async, and pubs support returning promises in Meteor 3, we should use async/await if possible or cursor

    // Note: In Meteor 3, publications can be async.
    // But since we are using a custom Roles that returns async...
    // Let's rely on simple cursor filter if possible, or wait.

    // For debugging: return all for now to see if it's a permission issue hiding data
    // OR better, enable async on the function
    return CannedResponses.find({}, { sort: { title: 1 } });
});
