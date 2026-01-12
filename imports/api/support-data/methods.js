import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { SupportData } from './support-data';
import { AuditLogs } from '../audit-logs/audit-logs';
import { SupportFiles } from './support-files';
import { Roles } from '../roles/roles';

// Dynamically import Encryption only on the server
let Encryption;
if (Meteor.isServer) {
    try {
        Encryption = require('/imports/api/support-data/server/encryption').Encryption;
    } catch (e) {
        console.error('Failed to load Encryption module:', e);
    }
}

Meteor.methods({
    async 'supportData.create'(doc) {
        console.log('[SupportData] create method called', { userId: this.userId, docTitle: doc.title });

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'User is not logged in');
        }

        // RELAXED Client check: Only check Roles on Server to avoid "Missing Subscription" issues on client
        if (Meteor.isServer) {
            const isAuthorized = await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']);
            if (!isAuthorized) {
                throw new Meteor.Error('not-authorized', 'User is not authorized');
            }
        }

        check(doc, {
            title: String,
            type: String,
            category: Match.Maybe(String),
            data: Object,
            meta: Match.Maybe(Object)
        });

        if (Meteor.isServer) {
            try {
                // Ensure Encryption is loaded
                if (!Encryption) {
                    throw new Meteor.Error('server-error', 'Encryption module not loaded');
                }

                // Encrypt password if type is credential
                if (doc.type === 'credential' && doc.data.password) {
                    doc.data.password = Encryption.encrypt(doc.data.password);
                }

                // Manually add timestamps
                doc.createdAt = new Date();
                doc.createdBy = this.userId;

                const docId = await SupportData.insertAsync(doc);
                console.log('[SupportData] Inserted docId:', docId);

                // Audit Log
                await AuditLogs.insertAsync({
                    userId: this.userId,
                    action: 'create',
                    entityType: 'SupportData',
                    entityId: docId,
                    metadata: {
                        title: doc.title,
                        type: doc.type,
                        details: `Created Support Data: ${doc.title} (${doc.type})`
                    },
                    createdAt: new Date()
                });

                return docId;
            } catch (e) {
                console.error('Error in supportData.create:', e);
                throw new Meteor.Error('create-failed', e.message);
            }
        }
    },

    async 'supportData.update'(id, modifier) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // RELAXED Client check
        if (Meteor.isServer) {
            const isAuthorized = await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']);
            if (!isAuthorized) {
                throw new Meteor.Error('not-authorized', 'User is not authorized');
            }
        }

        check(id, String);
        check(modifier, Object);

        if (Meteor.isServer) {
            try {
                if (!Encryption) {
                    throw new Meteor.Error('server-error', 'Encryption module not loaded');
                }

                if (modifier.$set && modifier.$set['data.password']) {
                    modifier.$set['data.password'] = Encryption.encrypt(modifier.$set['data.password']);
                }

                if (modifier.$set) {
                    modifier.$set.updatedAt = new Date();
                } else {
                    modifier.$set = { updatedAt: new Date() };
                }

                await SupportData.updateAsync(id, modifier);

                await AuditLogs.insertAsync({
                    userId: this.userId,
                    action: 'update',
                    entityType: 'SupportData',
                    entityId: id,
                    metadata: { details: `Updated Support Data: ${id}` },
                    createdAt: new Date()
                });
            } catch (e) {
                console.error('Error in supportData.update:', e);
                throw new Meteor.Error('update-failed', e.message);
            }
        }
    },

    async 'supportData.remove'(id) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // RELAXED Client check
        if (Meteor.isServer) {
            const isAuthorized = await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']);
            if (!isAuthorized) {
                throw new Meteor.Error('not-authorized', 'User is not authorized');
            }
        }

        check(id, String);

        if (Meteor.isServer) {
            const doc = await SupportData.findOneAsync(id);
            if (!doc) return;

            // If there is an associated file
            if ((doc.type === 'topology' || doc.type === 'backup') && doc.data && doc.data.fileId) {
                try {
                    SupportFiles.remove(doc.data.fileId);
                } catch (err) {
                    console.error("Error removing file:", err);
                }
            }

            await SupportData.removeAsync(id);

            await AuditLogs.insertAsync({
                userId: this.userId,
                action: 'delete',
                entityType: 'SupportData',
                entityId: id,
                metadata: {
                    title: doc.title,
                    details: `Deleted Support Data: ${doc.title}`
                },
                createdAt: new Date()
            });
        }
    },

    async 'supportData.getDecryptedPassword'(id) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (Meteor.isServer) {
            const isAuthorized = await Roles.userIsInRoleAsync(this.userId, ['admin', 'support']);
            if (!isAuthorized) {
                throw new Meteor.Error('not-authorized');
            }
        }

        check(id, String);

        if (Meteor.isServer) {
            if (!Encryption) {
                throw new Meteor.Error('server-error', 'Encryption module not loaded');
            }
            const doc = await SupportData.findOneAsync(id);
            if (doc && doc.type === 'credential' && doc.data && doc.data.password) {
                return Encryption.decrypt(doc.data.password);
            }
            return null;
        }
    }
});
