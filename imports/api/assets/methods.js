import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Assets } from './assets';
import { Roles } from '../roles/roles';
import { AuditLogs } from '../audit-logs/audit-logs';

Meteor.methods({
    async 'assets.create'(assetData) {
        check(assetData, {
            assetTag: String,
            name: String,
            type: String,
            brand: String,
            model: String,
            serialNumber: String,
            status: String,
            assignedToId: Match.Maybe(String),
            location: String,
            purchaseDate: Match.Maybe(Date),
            notes: Match.Maybe(String)
        });

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support/Admin can manage assets');
        }

        const existing = await Assets.findOneAsync({ assetTag: assetData.assetTag });
        if (existing) {
            throw new Meteor.Error('duplicate-tag', 'Asset Tag already exists');
        }

        // Get assignee name if assigned
        let assignedToName = null;
        if (assetData.assignedToId) {
            const user = await Meteor.users.findOneAsync(assetData.assignedToId);
            if (user) {
                assignedToName = user.profile?.fullName || user.emails[0].address;
            }
        }

        const assetId = await Assets.insertAsync({
            ...assetData,
            assignedToName,
            createdBy: this.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'asset_created',
            entityType: 'asset',
            entityId: assetId,
            metadata: { assetTag: assetData.assetTag, name: assetData.name },
            createdAt: new Date()
        });

        return assetId;
    },

    async 'assets.update'({ _id, ...updateData }) {
        check(_id, String);
        // check(updateData, Object); // Basic check, ideally match schema

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support/Admin can manage assets');
        }

        // Get assignee name if assigned changed
        if (updateData.assignedToId) {
            const user = await Meteor.users.findOneAsync(updateData.assignedToId);
            if (user) {
                updateData.assignedToName = user.profile?.fullName || user.emails[0].address;
            }
        } else if (updateData.assignedToId === null) {
            updateData.assignedToName = null;
        }

        await Assets.updateAsync(_id, {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            }
        });

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'asset_updated',
            entityType: 'asset',
            entityId: _id,
            metadata: { updates: Object.keys(updateData) },
            createdAt: new Date()
        });

        return true;
    },

    async 'assets.delete'(assetId) {
        check(assetId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['admin']))) {
            throw new Meteor.Error('not-authorized', 'Only Admin can delete assets');
        }

        const asset = await Assets.findOneAsync(assetId);
        if (!asset) throw new Meteor.Error('not-found');

        await Assets.removeAsync(assetId);

        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'asset_deleted',
            entityType: 'asset',
            entityId: assetId,
            metadata: { assetTag: asset.assetTag },
            createdAt: new Date()
        });

        return true;
    },

    async 'assets.search'(query) {
        check(query, String);
        if (!this.userId) return [];

        if (!query) return [];

        return Assets.find({
            $or: [
                { assetTag: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
                { serialNumber: { $regex: query, $options: 'i' } },
            ]
        }, { limit: 10 }).fetchAsync();
    }
});
