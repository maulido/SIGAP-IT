import { Mongo } from 'meteor/mongo';

export const CategoryConfigs = new Mongo.Collection('categoryConfigs');

// Category Config Schema:
// {
//   category: String, // e.g., 'Hardware', 'Software'
//   fields: [
//     {
//       name: String, // e.g., 'assetId'
//       label: String, // e.g., 'Asset Tag / Hostname'
//       type: String, // 'text', 'number', 'select', 'date', 'checkbox'
//       placeholder: String,
//       required: Boolean,
//       options: [String], // for select
//     }
//   ],
//   isActive: Boolean,
//   createdAt: Date
// }
