/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Tickets } from '/imports/api/tickets/tickets';
import { CategoryConfigs } from '/imports/api/category-configs/category-configs';
import '/imports/api/tickets/tickets-methods'; // Ensure methods are registered

if (Meteor.isServer) {
    describe('Tickets System', function () {
        let userId;

        beforeEach(async function () {
            // Create a test user
            const uniqueId = Random.id();
            userId = await Meteor.users.insertAsync({
                username: 'testuser-' + uniqueId,
                emails: [{ address: `test-${uniqueId}@example.com`, verified: true }],
                createdAt: new Date(),
                services: { password: { bcrypt: 'hashedpassword' } }
            });

            // Ensure 'Hardware' category config exists
            const existingConfig = await CategoryConfigs.findOneAsync({ category: 'Hardware' });
            if (!existingConfig) {
                await CategoryConfigs.insertAsync({
                    category: 'Hardware',
                    fields: [
                        { name: 'assetId', label: 'Asset ID', type: 'text', required: true },
                        { name: 'deviceType', label: 'Device Type', type: 'select', options: ['Laptop', 'Desktop'], required: true },
                        { name: 'model', label: 'Model', type: 'text', required: false }
                    ]
                });
            }
        });

        afterEach(async function () {
            if (userId) {
                await Meteor.users.removeAsync(userId);
                // Clean up tickets created by this user
                await Tickets.removeAsync({ reporterId: userId });
            }
        });

        it('can create a ticket with dynamic form metadata', async function () {
            const ticketData = {
                title: 'Test Dynamic Form Ticket',
                description: 'Testing metadata persistence',
                category: 'Hardware',
                priority: 'Medium',
                location: 'Test Lab',
                metadata: {
                    assetId: 'TEST-ASSET-001',
                    deviceType: 'Laptop',
                    model: 'X1 Carbon'
                }
            };

            // Simulate method call
            const method = Meteor.server.method_handlers['tickets.create'];
            if (!method) throw new Error('tickets.create method not found');

            const context = { userId };

            const response = await method.apply(context, [ticketData]);
            assert.isString(response.ticketId, 'Ticket ID should be returned');

            const ticket = await Tickets.findOneAsync(response.ticketId);
            assert.isDefined(ticket, 'Ticket should exist in DB');
            assert.equal(ticket.title, ticketData.title);
            assert.equal(ticket.metadata.assetId, 'TEST-ASSET-001');
            assert.equal(ticket.status, 'Open', 'Default status should be Open');
        });
    });
}
