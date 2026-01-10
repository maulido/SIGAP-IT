import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { PendingReasons } from './pending-reasons';
import { Roles } from '../roles/roles';

Meteor.methods({
    async 'pendingReasons.create'({ reason, description, defaultTimeout }) {
        check(reason, String);
        check(description, Match.Maybe(String));
        check(defaultTimeout, Number);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['admin'])) {
            throw new Meteor.Error('not-authorized', 'Only admins can create pending reasons');
        }

        const reasonId = await PendingReasons.insertAsync({
            reason,
            description: description || '',
            defaultTimeout,
            isActive: true,
            createdBy: this.userId,
        });

        return { reasonId };
    },

    async 'pendingReasons.list'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        return await PendingReasons.find(
            { isActive: true },
            { sort: { reason: 1 } }
        ).fetchAsync();
    },

    async 'pendingReasons.update'({ reasonId, reason, description, defaultTimeout, isActive }) {
        check(reasonId, String);
        check(reason, Match.Maybe(String));
        check(description, Match.Maybe(String));
        check(defaultTimeout, Match.Maybe(Number));
        check(isActive, Match.Maybe(Boolean));

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['admin'])) {
            throw new Meteor.Error('not-authorized', 'Only admins can update pending reasons');
        }

        const updateFields = {};
        if (reason !== undefined) updateFields.reason = reason;
        if (description !== undefined) updateFields.description = description;
        if (defaultTimeout !== undefined) updateFields.defaultTimeout = defaultTimeout;
        if (isActive !== undefined) updateFields.isActive = isActive;

        await PendingReasons.updateAsync(reasonId, { $set: updateFields });

        return { success: true };
    },
});
