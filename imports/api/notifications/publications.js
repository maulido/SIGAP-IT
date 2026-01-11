import { Meteor } from 'meteor/meteor';
import { Notifications } from './notifications';

Meteor.publish('notifications.myNotifications', function (limit = 20) {
    if (!this.userId) {
        return this.ready();
    }

    return Notifications.find(
        { userId: this.userId },
        {
            sort: { createdAt: -1 },
            limit: limit
        }
    );
});

Meteor.publish('notifications.unreadCount', function () {
    if (!this.userId) {
        return this.ready();
    }
    // Note: Pub/Sub doesn't natively support "counts" well without a package usually.
    // For simplicity, we might just subscribe to 'myNotifications' client side and count checks there,
    // or publish a specific cursor of unread items.
    // Let's publish all unread items (usually small number).

    return Notifications.find({ userId: this.userId, isRead: false });
});
