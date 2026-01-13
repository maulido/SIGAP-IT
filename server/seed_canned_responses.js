import { Meteor } from 'meteor/meteor';
import { CannedResponses } from '../imports/api/canned-responses/canned-responses';

Meteor.startup(async () => {
    const count = await CannedResponses.find().countAsync();
    if (count === 0) {
        console.log('🌱 Seeding Canned Responses...');

        const defaultResponses = [
            {
                title: 'Password Reset',
                category: 'Account',
                shortcut: '/reset',
                content: 'Please proceed to https://reset.sigap-it.com and follow the instructions to reset your password. If you encounter any issues, let us know.'
            },
            {
                title: 'Network Troubleshooting',
                category: 'Network',
                shortcut: '/network',
                content: 'Please try restarting your router and reconnecting. If the issue persists, provide your IP address.'
            },
            {
                title: 'Ticket Received',
                category: 'General',
                shortcut: '/ack',
                content: 'We have received your ticket and are currently reviewing looking into it. A support agent will be assigned shortly.'
            }
        ];

        // Find an admin user to assign as creator
        const admin = await Meteor.users.findOneAsync({ 'emails.address': 'admin@sigap-it.com' });
        const userId = admin ? admin._id : 'system';

        for (const response of defaultResponses) {
            await CannedResponses.insertAsync({
                ...response,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log('✅ Seeding Canned Responses Complete');
    }
});
