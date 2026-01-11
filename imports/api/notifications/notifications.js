import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const Notifications = new Mongo.Collection('notifications');

Notifications.schema = new SimpleSchema({
    userId: {
        type: String,
        label: "Recipient User ID"
    },
    type: {
        type: String,
        allowedValues: ['info', 'success', 'warning', 'error'],
        defaultValue: 'info'
    },
    title: {
        type: String,
        max: 200
    },
    message: {
        type: String,
        max: 1000
    },
    link: {
        type: String,
        optional: true
    },
    isRead: {
        type: Boolean,
        defaultValue: false
    },
    createdAt: {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return { $setOnInsert: new Date() };
            } else {
                this.unset();  // Prevent user from supplying their own value
            }
        }
    }
});

// Notifications.attachSchema(Notifications.schema);
