// Simple role management utility
// Since alanning:roles package has issues, we'll implement basic role management

export const Roles = {
    // Add roles to a user (async)
    async addUsersToRolesAsync(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        await Meteor.users.updateAsync(userId, {
            $addToSet: { roles: { $each: roles } }
        });
    },

    // Add roles to a user (sync - deprecated, use async version)
    addUsersToRoles(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        Meteor.users.update(userId, {
            $addToSet: { roles: { $each: roles } }
        });
    },

    // Check if user has a role (async)
    async userIsInRoleAsync(userId, roles) {
        if (!userId) return false;

        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.roles) return false;

        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        return roles.some(role => user.roles.includes(role));
    },

    // Check if user has a role (sync - for client side only)
    userIsInRole(userId, roles) {
        if (!userId) return false;

        const user = Meteor.users.findOne(userId);
        if (!user || !user.roles) return false;

        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        return roles.some(role => user.roles.includes(role));
    },

    // Get roles for a user (async)
    async getRolesForUserAsync(userId) {
        const user = await Meteor.users.findOneAsync(userId);
        return user?.roles || [];
    },

    // Get roles for a user (sync)
    getRolesForUser(userId) {
        const user = Meteor.users.findOne(userId);
        return user?.roles || [];
    },

    // Remove roles from user (async)
    async removeUsersFromRolesAsync(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        await Meteor.users.updateAsync(userId, {
            $pullAll: { roles }
        });
    },

    // Remove roles from user (sync)
    removeUsersFromRoles(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        Meteor.users.update(userId, {
            $pullAll: { roles }
        });
    }
};
