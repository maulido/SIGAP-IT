import { Mongo } from 'meteor/mongo';

export const CannedResponses = new Mongo.Collection('canned_responses');

CannedResponses.schema = {
    title: String,
    content: String,
    shortcut: String, // e.g. /reset
    category: String, // e.g. General, Network
    createdBy: String,
    createdAt: Date,
    updatedAt: Date
};
