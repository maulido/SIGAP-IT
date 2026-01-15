import { Mongo } from 'meteor/mongo';

export const Assets = new Mongo.Collection('assets');

// Schema
// {
//   assetTag: String, (e.g., NB-001)
//   name: String, (e.g., MacBook Pro 16)
//   type: String, (Laptop, Desktop, Printer, etc.)
//   brand: String,
//   model: String,
//   serialNumber: String,
//   status: String, (Active, InRepair, Retired, Lost)
//   assignedToId: String, (UserId)
//   assignedToName: String,
//   location: String,
//   purchaseDate: Date,
//   notes: String,
//   createdBy: String,
//   createdAt: Date,
//   updatedAt: Date
// }
