/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Tickets } from '/imports/api/tickets/tickets';
import { Roles } from '/imports/api/roles/roles';
import '/imports/api/reports/reports-methods';
import '/imports/api/tickets/tickets-methods';

if (Meteor.isServer) {
    describe('Reports System', function () {
        let supportUserId;
        let normalUserId;

        beforeEach(async function () {
            // Create support user
            const supportIdStr = Random.id();
            supportUserId = await Meteor.users.insertAsync({
                username: 'support-' + supportIdStr,
                emails: [{ address: `support-${supportIdStr}@example.com`, verified: true }],
                createdAt: new Date(),
                roles: ['support'],
                services: { password: { bcrypt: 'hashedpassword' } }
            });
            // Ensure role is set correctly if not handled by insert
            if (!(await Roles.userIsInRoleAsync(supportUserId, ['support']))) {
                await Roles.addUsersToRolesAsync(supportUserId, ['support']);
            }

            // Create normal user
            const normalIdStr = Random.id();
            normalUserId = await Meteor.users.insertAsync({
                username: 'user-' + normalIdStr,
                emails: [{ address: `user-${normalIdStr}@example.com`, verified: true }],
                createdAt: new Date(),
                services: { password: { bcrypt: 'hashedpassword' } }
            });
        });

        afterEach(async function () {
            if (supportUserId) await Meteor.users.removeAsync(supportUserId);
            if (normalUserId) await Meteor.users.removeAsync(normalUserId);
            // Clean up tickets created by this test (we can use reporterId to find them)
            if (normalUserId) await Tickets.removeAsync({ reporterId: normalUserId });
        });

        it('getTicketStats calculates correct metrics', async function () {
            // Create dummy tickets
            // 1. Resolved ticket (met SLA)
            await Tickets.insertAsync({
                title: 'Resolved Ticket',
                description: 'Testing',
                category: 'Hardware',
                priority: 'High',
                status: 'Resolved',
                reporterId: normalUserId,
                assignedToId: supportUserId,
                createdAt: new Date(Date.now() - 10000000),
                resolvedAt: new Date(Date.now() - 5000000),
                slaResolutionMet: true
            });

            // 2. Open ticket
            await Tickets.insertAsync({
                title: 'Open Ticket',
                description: 'Testing',
                category: 'Software',
                priority: 'Medium',
                status: 'Open',
                reporterId: normalUserId,
                createdAt: new Date()
            });

            // 3. User with no permissions should fail
            const method = Meteor.server.method_handlers['reports.getTicketStats'];
            if (!method) throw new Error('reports.getTicketStats method not found');

            try {
                await method.apply({ userId: normalUserId }, [{ startDate: new Date(0), endDate: new Date() }]);
                assert.fail('Should have thrown not-authorized');
            } catch (e) {
                assert.equal(e.error, 'not-authorized');
            }

            // 4. Support user should succeed
            const startDate = new Date(Date.now() - 20000000);
            const endDate = new Date(Date.now() + 10000); // slightly future to cover "now"

            const stats = await method.apply({ userId: supportUserId }, [{ startDate, endDate }]);

            assert.equal(stats.totalTickets, 2);
            assert.equal(stats.resolvedCount, 1);
            assert.equal(stats.resolvedPercentage, 50.0);
            assert.equal(stats.slaMetCount, 1);
            assert.equal(stats.categoryBreakdown['Hardware'], 1);
            assert.equal(stats.categoryBreakdown['Software'], 1);
        });
    });
}
