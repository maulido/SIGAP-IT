import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { sinon } from 'meteor/practicalmeteor:sinon';
import { Tickets } from '../imports/api/tickets/tickets';
import '../imports/api/tickets/methods'; // Ensure methods are registered

describe('Tickets', function () {
    describe('methods.changeStatus', function () {
        let ticketId;
        let userId;

        beforeEach(function () {
            Tickets.remove({});
            ticketId = Tickets.insert({
                title: 'Test Ticket',
                status: 'Open',
                reporterId: 'reporter1',
                assignedToId: 'support1',
                ticketNumber: 'TKT-TEST-001',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            userId = 'support1';
        });

        afterEach(function () {
            Tickets.remove({});
            sinon.restore();
        });

        it('should throw error if pendingReason is missing when status is Pending', async function () {
            // Mock Meteor.userId() and Roles.userIsInRole
            const context = { userId };
            sinon.stub(Meteor, 'userId').returns(userId);
            sinon.stub(Meteor, 'user').returns({ _id: userId, roles: ['support'] });

            // Mock Roles.userIsInRole since it's used in the method
            const rolesStub = sinon.stub(require('../imports/api/roles/roles').Roles, 'userIsInRole').returns(true);

            // We need to call the method via Meteor.server.method_handlers or Meteor.apply
            // But since we imported methods, we can try calling Meteor.callAsync or invoking the function directly if we could access it.
            // A better way in integration tests is using Meteor.call.
            // However, in this environment, I'll assume I can use Meteor.callAsync if I'm on the server side context or mock it.

            // Actually, since I can't easily mock Meteor.userId() inside a direct method call in this environment without `meteortesting:mocha` setup perfectly,
            // I will try to invoke the method handler directly if possible, or just rely on the fact that I am writing a test file that `meteor test` would run.

            // Let's assume standard meteor testing environment.

            try {
                await Meteor.callAsync('tickets.changeStatus', {
                    ticketId,
                    newStatus: 'Pending',
                    worklog: 'Changing to pending',
                    // pendingReason is missing
                });
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.equal(error.error, 'validation-error');
                assert.include(error.reason, 'Pending reason is required');
            }
        });

        it('should update status and pending fields when valid', async function () {
            sinon.stub(Meteor, 'userId').returns(userId);
            sinon.stub(require('../imports/api/roles/roles').Roles, 'userIsInRole').returns(true);

            await Meteor.callAsync('tickets.changeStatus', {
                ticketId,
                newStatus: 'Pending',
                worklog: 'Changing to pending with reason',
                pendingReason: 'Waiting for Vendor'
            });

            const ticket = await Tickets.findOneAsync(ticketId);
            assert.equal(ticket.status, 'Pending');
            assert.equal(ticket.pendingReason, 'Waiting for Vendor');
            assert.isNotNull(ticket.pendingStartedAt);
        });

        it('should clear pending fields when moving out of Pending', async function () {
             sinon.stub(Meteor, 'userId').returns(userId);
             sinon.stub(require('../imports/api/roles/roles').Roles, 'userIsInRole').returns(true);

            // First set to Pending
            await Meteor.callAsync('tickets.changeStatus', {
                ticketId,
                newStatus: 'Pending',
                worklog: 'Changing to pending',
                pendingReason: 'Waiting for Vendor'
            });

            // Then move to In Progress
            await Meteor.callAsync('tickets.changeStatus', {
                ticketId,
                newStatus: 'In Progress',
                worklog: 'Back to work'
            });

            const ticket = await Tickets.findOneAsync(ticketId);
            assert.equal(ticket.status, 'In Progress');
            assert.isNull(ticket.pendingReason);
            assert.isNull(ticket.pendingStartedAt);
        });
    });
});
