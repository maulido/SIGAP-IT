
import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Notifications } from '/imports/api/notifications/notifications';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';

if (Meteor.isServer) {
    describe('Authentication and Notifications', function () {
        let userId;

        beforeEach(function () {
            resetDatabase();

            // Create a test user
            userId = Accounts.createUser({
                email: `test-${Random.id()}@example.com`,
                password: 'password123',
                profile: { fullName: 'Test User' }
            });
        });

        describe('Authentication', function () {
            it('users.login should return a token for valid credentials', async function () {
                const user = Meteor.users.findOne(userId);

                // We need to run this in a context where we can call the method
                // But users.login is a method, we can call it directly via Meteor.server.method_handlers or Meteor.callAsync

                try {
                    const result = await Meteor.callAsync('users.login', user.emails[0].address, 'password123');
                    assert.isDefined(result);
                    assert.isDefined(result.id);
                    assert.isDefined(result.token);
                    assert.equal(result.id, userId);
                } catch (error) {
                    throw new Error('users.login failed: ' + error.reason);
                }
            });

            it('users.login should fail for invalid password', async function () {
                const user = Meteor.users.findOne(userId);
                try {
                    await Meteor.callAsync('users.login', user.emails[0].address, 'wrongpassword');
                    assert.fail('Should have thrown an error');
                } catch (error) {
                    assert.equal(error.error, 'login-failed');
                }
            });
        });

        describe('Notifications', function () {
            it('can create a notification via method', async function () {
                // Mock context
                const context = { userId };
                const method = Meteor.server.method_handlers['notifications.create'];

                const notificationId = await method.apply(context, [{
                    userId: userId,
                    title: 'Test Notification',
                    message: 'This is a test',
                    type: 'info'
                }]);

                assert.isString(notificationId);
                const notification = await Notifications.findOneAsync(notificationId);

                assert.isDefined(notification);
                assert.equal(notification.title, 'Test Notification');
                assert.isFalse(notification.isRead);
            });

            it('can mark a notification as read', async function () {
                // Insert directly first
                const notificationId = await Notifications.insertAsync({
                    userId,
                    title: 'Test',
                    message: 'Message',
                    type: 'info',
                    isRead: false,
                    createdAt: new Date()
                });

                const context = { userId };
                const method = Meteor.server.method_handlers['notifications.markAsRead'];

                await method.apply(context, [notificationId]);

                const notification = await Notifications.findOneAsync(notificationId);
                assert.isTrue(notification.isRead);
            });
        });
    });
}
