import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from '../roles/roles';
import { AuditLogs } from '../audit-logs/audit-logs';

Meteor.methods({
    async 'users.register'({ email, password, fullName, department, location, phone, role = 'user' }) {
        check(email, String);
        check(password, String);
        check(fullName, String);
        check(department, String);
        check(location, String);
        check(phone, String);
        check(role, String);

        // Only admins can create users with roles other than 'user'
        if (role !== 'user' && this.userId) {
            if (!Roles.userIsInRole(this.userId, 'admin')) {
                throw new Meteor.Error('not-authorized', 'Only admins can create support/admin users');
            }
        }

        const userId = Accounts.createUser({
            email,
            password,
            profile: {
                fullName,
                department,
                location,
                phone,
                isActive: true,
            },
        });

        // Assign role
        Roles.addUsersToRoles(userId, [role]);

        // Log audit
        if (this.userId) {
            await AuditLogs.insertAsync({
                userId: this.userId,
                action: 'user_created',
                entityType: 'user',
                entityId: userId,
                metadata: { email, role },
                createdAt: new Date(),
            });
        }

        return userId;
    },

    async 'users.update'({ userId, fullName, department, location, phone }) {
        check(userId, String);
        check(fullName, String);
        check(department, String);
        check(location, String);
        check(phone, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Users can update their own profile, admins can update anyone
        if (this.userId !== userId && !Roles.userIsInRole(this.userId, 'admin')) {
            throw new Meteor.Error('not-authorized');
        }

        await Meteor.users.updateAsync(userId, {
            $set: {
                'profile.fullName': fullName,
                'profile.department': department,
                'profile.location': location,
                'profile.phone': phone,
            },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'user_updated',
            entityType: 'user',
            entityId: userId,
            createdAt: new Date(),
        });

        return true;
    },

    async 'users.deactivate'(userId) {
        check(userId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, 'admin')) {
            throw new Meteor.Error('not-authorized', 'Only admins can deactivate users');
        }

        await Meteor.users.updateAsync(userId, {
            $set: {
                'profile.isActive': false,
            },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'user_deactivated',
            entityType: 'user',
            entityId: userId,
            createdAt: new Date(),
        });

        return true;
    },
});

// Publications
Meteor.publish('users.all', function () {
    if (!this.userId) {
        return this.ready();
    }

    if (!Roles.userIsInRole(this.userId, 'admin')) {
        return this.ready();
    }

    return Meteor.users.find({}, {
        fields: {
            emails: 1,
            profile: 1,
            roles: 1,
            createdAt: 1,
        },
    });
});

Meteor.publish('users.active', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Meteor.users.find(
        { 'profile.isActive': true },
        {
            fields: {
                'profile.fullName': 1,
                'profile.department': 1,
                roles: 1,
            },
        }
    );
});

Meteor.publish('users.current', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Meteor.users.find(this.userId, {
        fields: {
            emails: 1,
            profile: 1,
            roles: 1,
        },
    });
});
