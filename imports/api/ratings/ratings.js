import { Mongo } from 'meteor/mongo';

export const Ratings = new Mongo.Collection('ratings');

// Schema (for documentation)
// {
//   ticketId: String (reference to Tickets),
//   ticketNumber: String (for easy reference),
//   rating: Number (1-5 stars),
//   feedback: String (optional comment),
//   ratedBy: String (userId - ticket reporter),
//   ratedAt: Date,
//
//   // Additional context
//   resolvedBy: String (userId who resolved the ticket),
//   category: String (ticket category),
//   priority: String (ticket priority),
//   resolutionTime: Number (hours from creation to resolution),
// }
