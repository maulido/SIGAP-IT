import { Mongo } from 'meteor/mongo';

export const KBArticles = new Mongo.Collection('kbArticles');

// KB Article Schema (for documentation)
// {
//   title: String,
//   content: String (markdown or plain text),
//   category: String (same as ticket categories: Hardware, Software, Network, Email, Printer, Other),
//   tags: Array of String,
//   keywords: Array of String (for search),
//   viewCount: Number (default 0),
//   helpfulCount: Number (default 0),
//   notHelpfulCount: Number (default 0),
//   isPublished: Boolean (default false),
//   createdBy: String (userId),
//   updatedBy: String (userId),
//   createdAt: Date,
//   updatedAt: Date,
// }
