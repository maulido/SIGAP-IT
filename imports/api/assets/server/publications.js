import { Meteor } from 'meteor/meteor';
import { Assets } from '../assets';
import { Roles } from '../../roles/roles';

Meteor.publish('assets.all', async function () {
    if (!this.userId) return this.ready();

    if (await Roles.userIsInRoleAsync(this.userId, ['support', 'admin'])) {
        return Assets.find({}, { sort: { createdAt: -1 } });
    }

    return this.ready();
});

Meteor.publish('assets.byId', function (id) {
    if (!this.userId) return this.ready();
    return Assets.find({ _id: id });
});

Meteor.publish('assets.search', function (query) {
    if (!this.userId || !query) return this.ready();

    return Assets.find({
        $or: [
            { assetTag: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
        ]
    }, { limit: 20 });
});
