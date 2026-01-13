import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { CannedResponses } from './canned-responses';
import { Roles } from '../roles/roles';

Meteor.methods({
    async 'cannedResponses.create'({ title, content, shortcut, category }) {
        console.log('Method cannedResponses.create called', { title, userId: this.userId });

        check(title, String);
        check(content, String);
        check(shortcut, String);
        check(category, String);

        if (!this.userId) {
            console.error('Method failed: No userId');
            throw new Meteor.Error('not-authorized');
        }

        const hasRole = await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']);
        console.log('Role check result:', hasRole);

        if (!hasRole) {
            console.error('Method failed: Not authorized');
            throw new Meteor.Error('not-authorized', 'Only IT Support can manage canned responses');
        }

        const result = await CannedResponses.insertAsync({
            title,
            content,
            shortcut,
            category,
            createdBy: this.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Canned Response inserted:', result);
        return result;
    },

    async 'cannedResponses.update'(id, { title, content, shortcut, category }) {
        check(id, String);
        check(title, String);
        check(content, String);
        check(shortcut, String);
        check(category, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized');
        }

        await CannedResponses.updateAsync(id, {
            $set: {
                title,
                content,
                shortcut,
                category,
                updatedAt: new Date()
            }
        });
    },

    async 'cannedResponses.remove'(id) {
        check(id, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized');
        }

        await CannedResponses.removeAsync(id);
    }
});
