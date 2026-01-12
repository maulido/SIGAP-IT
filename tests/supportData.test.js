/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { SupportData } from '/imports/api/support-data/support-data';
import { Roles } from '/imports/api/roles/roles';
import '/imports/api/support-data/methods';

if (Meteor.isServer) {
    describe('Support Data System', function () {
        let supportUserId;
        let normalUserId;

        beforeEach(async function () {
            // Create support user
            const supportIdStr = Random.id();
            supportUserId = await Meteor.users.insertAsync({
                username: 'support-data-' + supportIdStr,
                emails: [{ address: `support-data-${supportIdStr}@example.com`, verified: true }],
                createdAt: new Date(),
                roles: ['support'],
                services: { password: { bcrypt: 'hashedpassword' } }
            });
            if (!(await Roles.userIsInRoleAsync(supportUserId, ['support']))) {
                await Roles.addUsersToRolesAsync(supportUserId, ['support']);
            }

            // Create normal user
            const normalIdStr = Random.id();
            normalUserId = await Meteor.users.insertAsync({
                username: 'user-data-' + normalIdStr,
                emails: [{ address: `user-data-${normalIdStr}@example.com`, verified: true }],
                createdAt: new Date(),
                services: { password: { bcrypt: 'hashedpassword' } }
            });
        });

        afterEach(async function () {
            if (supportUserId) await Meteor.users.removeAsync(supportUserId);
            if (normalUserId) await Meteor.users.removeAsync(normalUserId);
            await SupportData.removeAsync({});
        });

        it('Support user can create and read support data', async function () {
            const doc = {
                title: 'Test Credentials',
                type: 'credential',
                category: 'Network',
                data: {
                    username: 'admin',
                    password: 'secretpassword'
                },
                meta: {}
            };

            const method = Meteor.server.method_handlers['supportData.create'];

            // Execute as support user
            const resultId = await method.apply({ userId: supportUserId }, [doc]);
            assert.isString(resultId);

            // Verify insertion
            const savedDoc = await SupportData.findOneAsync(resultId);
            assert.equal(savedDoc.title, 'Test Credentials');

            // Verify encryption occurred (password should not be plain)
            assert.notEqual(savedDoc.data.password, 'secretpassword');

            // Verify Decryption
            const decryptMethod = Meteor.server.method_handlers['supportData.getDecryptedPassword'];
            const decrypted = await decryptMethod.apply({ userId: supportUserId }, [resultId]);
            assert.equal(decrypted, 'secretpassword');
        });

        it('Normal user CANNOT create support data', async function () {
            const doc = {
                title: 'Hacked Credentials',
                type: 'credential',
                data: { password: '123' }
            };

            const method = Meteor.server.method_handlers['supportData.create'];

            try {
                await method.apply({ userId: normalUserId }, [doc]);
                assert.fail('Should have thrown not-authorized');
            } catch (e) {
                assert.equal(e.error, 'not-authorized');
            }
        });

        it('Support data publication allows support role', async function () {
            // Mock publication context
            const pub = Meteor.server.publish_handlers['supportData.all'];

            // 1. As Support User
            const cursorSupport = await pub.apply({ userId: supportUserId, ready: () => { } });
            assert.isDefined(cursorSupport, 'Should return cursor for support user');
        });
    });
}
