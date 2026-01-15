import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Announcements } from './announcements';
import { Roles } from '../roles/roles';
import { AuditLogs } from '../audit-logs/audit-logs';

Meteor.methods({
    async 'announcements.create'({ title, message, type, startAt, endAt, isActive }) {
        check(title, String);
        check(message, String);
        check(type, String);
        check(startAt, Date);
        check(endAt, Date);
        check(isActive, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']))) {
            throw new Meteor.Error('not-authorized', 'Only Admin/Support can manage announcements');
        }

        const announcementId = await Announcements.insertAsync({
            title,
            message,
            type,
            isActive,
            startAt,
            endAt,
            createdBy: this.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'announcement_created',
            entityType: 'announcement',
            entityId: announcementId,
            metadata: { title, type },
            createdAt: new Date()
        });

        return announcementId;
    },

    async 'announcements.update'({ _id, title, message, type, startAt, endAt, isActive }) {
        check(_id, String);
        check(title, String);
        check(message, String);
        check(type, String);
        check(startAt, Date);
        check(endAt, Date);
        check(isActive, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']))) {
            throw new Meteor.Error('not-authorized', 'Only Admin/Support can manage announcements');
        }

        await Announcements.updateAsync(_id, {
            $set: {
                title,
                message,
                type,
                startAt,
                endAt,
                isActive,
                updatedAt: new Date(),
            }
        });

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'announcement_updated',
            entityType: 'announcement',
            entityId: _id,
            metadata: { title, type },
            createdAt: new Date()
        });

        return true;
    },

    async 'announcements.delete'(announcementId) {
        check(announcementId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['admin']))) {
            throw new Meteor.Error('not-authorized', 'Only Admin can delete announcements');
        }

        const announcement = await Announcements.findOneAsync(announcementId);
        if (!announcement) throw new Meteor.Error('not-found');

        await Announcements.removeAsync(announcementId);

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'announcement_deleted',
            entityType: 'announcement',
            entityId: announcementId,
            metadata: { title: announcement.title },
            createdAt: new Date()
        });

        return true;
    }
});
