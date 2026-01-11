import { Mongo } from 'meteor/mongo';

export const Escalations = new Mongo.Collection('escalations');

// Schema (for documentation)
// {
//   ticketId: String (reference to Tickets),
//   ticketNumber: String (for easy reference),
//   escalationLevel: Number (1 = warning at 75%, 2 = critical at 90%),
//   escalatedAt: Date,
//   escalatedBy: String ('system' for auto-escalation),
//   notifiedUsers: [String] (array of user IDs notified),
//   slaDeadline: Date (original SLA deadline),
//   percentageUsed: Number (percentage of SLA time used),
//   acknowledged: Boolean,
//   acknowledgedBy: String (userId),
//   acknowledgedAt: Date,
//   metadata: {
//     priority: String,
//     category: String,
//     assignedTo: String,
//     status: String
//   },
//   createdAt: Date
// }
