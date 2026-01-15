import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from '../roles/roles';
import { AuditLogs } from '../audit-logs/audit-logs';

Meteor.methods({
    async 'users.register'(userData) {
        try {
            console.log('[users.register] START - userData:', JSON.stringify(userData));

            // Destructure from userData parameter
            const { email, password, fullName, department, location, phone, role = 'user' } = userData;

            console.log('[users.register] Destructured values:', { email, fullName, department, location, phone, role });

            check(email, String);
            check(password, String);
            check(fullName, String);
            check(department, String);
            check(location, String);
            check(phone, String);
            check(role, String);

            console.log('[users.register] Validation passed');

            // Only admins can create users with roles other than 'user'
            if (role !== 'user' && this.userId) {
                if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
                    throw new Meteor.Error('not-authorized', 'Only admins can create support/admin users');
                }
            }

            console.log('[users.register] About to create user manually');

            // Check if user already exists
            const existingUser = await Meteor.users.findOneAsync({ 'emails.address': email });
            if (existingUser) {
                throw new Meteor.Error('email-exists', 'A user with this email already exists');
            }

            // Create user manually - Accounts.createUser doesn't exist on server in Meteor 3.x
            let userId;
            try {
                // Import bcrypt for password hashing
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);

                userId = await Meteor.users.insertAsync({
                    emails: [{ address: email, verified: false }],
                    services: {
                        password: {
                            bcrypt: hashedPassword
                        }
                    },
                    profile: {
                        fullName,
                        department,
                        location,
                        phone,
                        isActive: true,
                    },
                    roles: [role],
                    createdAt: new Date(),
                });
                console.log('[users.register] User created manually - userId:', userId);
            } catch (createError) {
                console.error('[users.register] User creation FAILED:', createError);
                throw new Meteor.Error('user-creation-failed', `Failed to create user: ${createError.message}`);
            }

            console.log('[users.register] User created with role successfully');

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
                console.log('[users.register] Audit log created');
            }

            console.log('[users.register] SUCCESS - returning userId:', userId);
            return userId;
        } catch (error) {
            console.error('[users.register] FATAL ERROR:', error);
            console.error('[users.register] Error stack:', error.stack);
            throw error;
        }
    },

    async 'users.update'({ userId, fullName, department, location, phone, role }) {
        check(userId, String);
        check(fullName, String);
        check(department, String);
        check(location, String);
        check(phone, String);
        if (role) check(role, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get current user to check roles
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser) {
            throw new Meteor.Error('user-not-found');
        }

        // Users can update their own profile, admins can update anyone
        const isAdmin = currentUser.roles && currentUser.roles.includes('admin');
        const isOwnProfile = this.userId === userId;

        if (!isOwnProfile && !isAdmin) {
            throw new Meteor.Error('not-authorized', 'You can only edit your own profile');
        }

        // Only admins can change roles
        if (role && !isAdmin) {
            throw new Meteor.Error('not-authorized', 'Only admins can change user roles');
        }

        // Prepare update object
        const updateFields = {
            'profile.fullName': fullName,
            'profile.department': department,
            'profile.location': location,
            'profile.phone': phone,
        };

        // Add role if provided and user is admin
        if (role && isAdmin) {
            updateFields.roles = [role];
        }

        await Meteor.users.updateAsync(userId, {
            $set: updateFields,
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

        if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
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

    async 'users.activate'(userId) {
        check(userId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
            throw new Meteor.Error('not-authorized', 'Only admins can activate users');
        }

        await Meteor.users.updateAsync(userId, {
            $set: {
                'profile.isActive': true,
            },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'user_activated',
            entityType: 'user',
            entityId: userId,
            createdAt: new Date(),
        });

        return true;
    },

    async 'users.changeRole'({ userId, newRole }) {
        check(userId, String);
        check(newRole, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
            throw new Meteor.Error('not-authorized', 'Only admins can change user roles');
        }

        // Validate role
        const validRoles = ['user', 'support', 'admin'];
        if (!validRoles.includes(newRole)) {
            throw new Meteor.Error('invalid-role', 'Invalid role specified');
        }

        // Get current roles
        const user = await Meteor.users.findOneAsync(userId);
        const currentRoles = user.roles || [];

        // Remove all current roles and add new role
        await Meteor.users.updateAsync(userId, {
            $set: { roles: [newRole] },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'user_role_changed',
            entityType: 'user',
            entityId: userId,
            metadata: { oldRole: currentRoles[0], newRole },
            createdAt: new Date(),
        });

        return true;
    },

    async 'users.resetPassword'({ userId, newPassword }) {
        check(userId, String);
        check(newPassword, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
            throw new Meteor.Error('not-authorized', 'Only admins can reset passwords');
        }

        if (newPassword.length < 6) {
            throw new Meteor.Error('password-too-short', 'Password must be at least 6 characters');
        }

        // Set new password
        if (Meteor.isServer) {
            Accounts.setPassword(userId, newPassword);
        }

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'user_password_reset',
            entityType: 'user',
            entityId: userId,
            createdAt: new Date(),
        });

        return true;
    },
});

// Publications
Meteor.publish('users.all', async function () {
    if (!this.userId) {
        return this.ready();
    }

    // Only admins can see all users with full details
    if (!(await Roles.userIsInRoleAsync(this.userId, 'admin'))) {
        return this.ready();
    }

    return Meteor.users.find({}, {
        fields: {
            emails: 1,
            profile: 1,
            roles: 1,
            createdAt: 1,
            status: 1 // Add status field if needed
        },
    });
});

Meteor.publish('users.names', function () {
    if (!this.userId) {
        return this.ready();
    }

    // All authenticated users can see basic user info for display purposes
    return Meteor.users.find({}, {
        fields: {
            'profile.fullName': 1,
            'profile.department': 1,
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
