import { Meteor } from 'meteor/meteor';
import { CategoryConfigs } from '../category-configs';

Meteor.publish('categoryConfigs.all', function () {
    if (!this.userId) {
        return this.ready();
    }
    return CategoryConfigs.find({ isActive: true });
});
