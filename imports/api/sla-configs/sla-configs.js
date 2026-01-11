import { Mongo } from 'meteor/mongo';

export const SLAConfigs = new Mongo.Collection('slaConfigs');

// SLA Config Schema:
// {
//   priority: String (Critical, High, Medium, Low),
//   responseTime: Number (hours),
//   resolutionTime: Number (hours),
//   businessHoursOnly: Boolean, // If true, only count 9-5 MF
//   isActive: Boolean,
//   createdAt: Date
// }

