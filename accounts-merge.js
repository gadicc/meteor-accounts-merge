/*
 * If a user signs in using a service type for the first time, but we already have
 * an existing record for them, merge the records, don't create a seperate one.
 *
 */

AccountsExtra = {
    init: function(options) {
        _.extend(this.options, options);
    },
    options: {
        saveProfilePic: false,
        overwriteExistingProfilePic: false,
        profilePicFallback: '/packages/accounts-merge/avatar-empty.png',

        saveLocation: false,

        saveProfileName: true,
        overwriteExistingProfileName: false,
        profileNameFallback: 'Anonymous',

        saveServiceUsername: false
    },
    services: {},
    hooks: {
        onCreateUser: {}
    }
};

Accounts.onCreateUser(function(options, user) {
    console.log(user);
    if (!user.services)
        return user;

    var service = _.keys(user.services)[0];
    var email = user.services[service].email;

    // see if any existing user has this email address, otherwise create new
    var existingUser = null;
    if (email) {
        existingUser = Meteor.users.findOne({'emails.address': email});
        if (existingUser) {
            // precaution, these will exist from accounts-password if used
            if (!existingUser.services)
                existingUser.services = { resume: { loginTokens: [] }};
            if (!existingUser.services.resume)
                existingUser.services.resume = { loginTokens: [] };

            // copy accross new service info
            existingUser.services[service] = user.services[service];
            existingUser.services.resume.loginTokens.push(
                user.services.resume.loginTokens[0]
            );
            user = existingUser;
        }
    }

    if (!user.profile)
        user.profile = {};

    var serviceArgs = null;
    if (AccountsExtra.services[service])
        serviceArgs = AccountsExtra.services[service](user, user.services[service]);

    for (func in AccountsExtra.hooks.onCreateUser)
        AccountsExtra.hooks.onCreateUser[func](user, serviceArgs);

    if (!user.profile.name && AccountsExtra.options.profileNameFallback)
        user.profile.name = AccountsExtra.options.profileNameFallback;

    // if we're merging, delete existing record so we can return a user
    // object with same _id, that Meteor will go on to insert (this is 'safe',
    // I promise).
    if (existingUser)
        Meteor.users.remove({_id: user._id});

    // insert new record, or reinsert old record (with identical _id)
    return user;
});
