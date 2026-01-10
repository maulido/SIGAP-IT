import { Mongo } from 'meteor/mongo';

export const PendingReasons = new Mongo.Collection('pendingReasons');

// Schema definition (for documentation purposes)
// {
//     reason: String (max 200),
//     description: String (optional, max 500),
//     defaultTimeout: Number (in hours, default 24, min 1, max 168),
//     isActive: Boolean (default true),
//     createdAt: Date,
//     createdBy: String (userId),
// }
