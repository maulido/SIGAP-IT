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

if (Meteor.isServer) {
    Meteor.startup(() => {
        // Create text index for search
        KBArticles.rawCollection().createIndex({
            title: 'text',
            content: 'text',
            tags: 'text',
            keywords: 'text'
        }, {
            weights: {
                title: 10,
                keywords: 5,
                tags: 5,
                content: 1
            },
            name: 'KBDataTextIndex'
        }).catch(e => console.error('Error creating KB index:', e));
    });
}
