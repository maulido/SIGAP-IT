// Simple role management utility
// Since alanning:roles package has issues, we'll implement basic role management

export const Roles = {
    // Add roles to a user
    addUsersToRoles(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        Meteor.users.update(userId, {
            $addToSet: { roles: { $each: roles } }
        });
    },

    // Check if user has a role
    userIsInRole(userId, roles) {
        if (!userId) return false;

        const user = Meteor.users.findOne(userId);
        if (!user || !user.roles) return false;

        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        return roles.some(role => user.roles.includes(role));
    },

    // Get roles for a user
    getRolesForUser(userId) {
        const user = Meteor.users.findOne(userId);
        return user?.roles || [];
    },

    // Remove roles from user
    removeUsersFromRoles(userId, roles) {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        Meteor.users.update(userId, {
            $pullAll: { roles }
        });
    }
};
