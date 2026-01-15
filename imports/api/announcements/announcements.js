import { Mongo } from 'meteor/mongo';


export const Announcements = new Mongo.Collection('announcements');

// Schema for documentation/validation
// {
//   title: String,
//   message: String,
//   type: String ('info', 'warning', 'critical'),
//   isActive: Boolean,
//   startAt: Date,
//   endAt: Date,
//   createdBy: String (userId),
//   createdAt: Date,
//   updatedAt: Date
// }
