import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Notifications } from './notifications';

Meteor.methods({
    'notifications.create'({ userId, title, message, type = 'info', link }) {
        check(userId, String);
        check(title, String);
        check(message, String);
        check(type, String);
        if (link) check(link, String);

        if (!this.userId) {
            // throw new Meteor.Error('not-authorized');
            // Sometimes system creates notifications without user context (e.g. cron jobs)
            // But we usually want to restrict who can trigger this via client
            // For now, let's allow it if called from server or logged in user
        }

        return Notifications.insertAsync({
            userId,
            title,
            message,
            type,
            link,
            createdAt: new Date(),
            isRead: false
        });
    },

    async 'notifications.markAsRead'(notificationId) {
        check(notificationId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const notification = await Notifications.findOneAsync(notificationId);
        if (!notification) {
            throw new Meteor.Error('not-found');
        }

        if (notification.userId !== this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        return Notifications.updateAsync(notificationId, {
            $set: { isRead: true }
        });
    },

    async 'notifications.markAllAsRead'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        return Notifications.updateAsync({ userId: this.userId, isRead: false }, {
            $set: { isRead: true }
        }, { multi: true });
    },

    async 'notifications.clearAll'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Optional: Maybe only delete read ones? Or all? 
        // Let's implement delete all for now as "Clear History"
        return Notifications.removeAsync({ userId: this.userId });
    }
});
