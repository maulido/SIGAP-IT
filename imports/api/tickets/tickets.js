import { Mongo } from 'meteor/mongo';

export const Tickets = new Mongo.Collection('tickets');

// Ticket Schema (for documentation)
// {
//   ticketNumber: String (auto-generated, e.g., "TKT-2026-0001"),
//   title: String,
//   description: String,
//   category: String (Hardware, Software, Network, Email, Printer, Other),
//   priority: String (Low, Medium, High, Critical),
//   status: String (Open, In Progress, Pending, Resolved, Closed, Rejected),
//   location: String,
//   reporterId: String (userId),
//   assignedToId: String (userId, optional),
//
//   // Pending workflow fields
//   pendingReason: String (optional),
//   pendingReasonId: String (optional, reference to PendingReasons),
//   pendingTimeout: Date (optional),
//   pendingSetAt: Date (optional),
//   pendingSetBy: String (optional, userId),
//   pendingNotes: String (optional),
//
//   // Rating fields
//   hasRating: Boolean (default false),
//   ratingValue: Number (1-5, optional),
//
//   // Parent-Child Relationship fields
//   parentTicketId: String (optional, reference to parent Ticket),
//   parentTicketNumber: String (optional, for easy reference),
//   childTicketIds: Array of String (optional, references to child Tickets),
//   hasChildren: Boolean (default false),
//
//   // Timestamps
//   createdAt: Date,
//   updatedAt: Date,
//   resolvedAt: Date (optional),
//   closedAt: Date (optional),
// }
