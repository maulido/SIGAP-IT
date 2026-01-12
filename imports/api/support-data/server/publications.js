import { Meteor } from 'meteor/meteor';
import { SupportData } from '../support-data';

import { Roles } from '../../roles/roles';

Meteor.publish('supportData.all', async function () {
    if (!this.userId || !(await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']))) {
        return this.ready();
    }

    // We publish everything.
    // CRITICAL: We publish encrypted passwords as is. 
    // Decryption happens via method call when explicitly requested to view.
    return SupportData.find();
});
