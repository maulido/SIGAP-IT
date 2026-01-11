// Script to check and fix admin user role
// Run this in Meteor shell: meteor shell
// Then paste this code

const checkAndFixAdminRole = async () => {
    const adminUser = await Meteor.users.findOneAsync({
        'emails.address': 'admin@sigap-it.com'
    });

    if (!adminUser) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log('📋 Current admin user data:');
    console.log('Email:', adminUser.emails[0].address);
    console.log('Full Name:', adminUser.profile?.fullName);
    console.log('Roles:', adminUser.roles);
    console.log('Role type:', typeof adminUser.roles);
    console.log('Is Array:', Array.isArray(adminUser.roles));

    // Fix if roles is not correct
    if (!adminUser.roles || !Array.isArray(adminUser.roles) || !adminUser.roles.includes('admin')) {
        console.log('\n🔧 Fixing admin role...');
        await Meteor.users.updateAsync(adminUser._id, {
            $set: { roles: ['admin'] }
        });
        console.log('✅ Admin role fixed!');

        // Verify
        const updated = await Meteor.users.findOneAsync({ _id: adminUser._id });
        console.log('New roles:', updated.roles);
    } else {
        console.log('\n✅ Admin role is correct!');
    }
};

// Run the check
checkAndFixAdminRole();
