import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const SupportData = new Mongo.Collection('support_data');

const SupportDataSchema = new SimpleSchema({
    title: {
        type: String,
        label: "Title/Name"
    },
    type: {
        type: String,
        allowedValues: ['topology', 'credential', 'general', 'backup'],
        label: "Type of Data"
    },
    category: {
        type: String,
        optional: true,
        label: "Category"
    },
    // Dynamic data field
    data: {
        type: Object,
        blackbox: true,
        optional: true
    },
    // Meta data for expiry, etc
    meta: {
        type: Object,
        optional: true
    },
    "meta.expiryDate": {
        type: Date,
        optional: true
    },
    "meta.expiryNotified": {
        type: Boolean,
        optional: true,
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
    },
    updatedAt: {
        type: Date,
        autoValue: function () {
            if (this.isUpdate) {
                return new Date();
            }
        },
        optional: true
    },
    createdBy: {
        type: String,
        autoValue: function () {
            if (this.isInsert) {
                return this.userId;
            } else if (this.isUpsert) {
                return { $setOnInsert: this.userId };
            } else {
                this.unset();
            }
        }
    }
});

// SupportData.attachSchema(SupportDataSchema);
