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
        // general options
        saveCreatedAt: false,

        // stuff to take from services
        saveProfilePic: false,
        overwriteExistingProfilePic: false,
        profilePicFallback: '/packages/accounts-merge/avatar-empty.png',

        saveLocation: false,

        saveProfileName: true,
        overwriteExistingProfileName: false,
        profileNameEmailFallback: true,
        profileNameTextFallback: 'Anonymous',

        saveServiceUsername: false
    },
    services: {},
    hooks: {
    		beforeCreateUser: {},
        onCreateUser: {}
    }
};

Accounts.onCreateUser(function(options, user) {
    console.log(user);

    if (!user.services)
        return user;

    var service = _.keys(user.services)[0];
    var email = user.services[service].email
        || (user.services[service].emails && user.services[service].emails[0])
        || (user.emails && user.emails[0] && user.emails[0].address);
    console.log(email);

    // see if any existing user has this email address, otherwise create new
    var existingUser = null;
    if (email) {
        existingUser = Meteor.users.findOne({'emails.address': email});
        if (existingUser) {
            console.log(existingUser);

            // precaution, these will exist from accounts-password if used
            if (!existingUser.services)
                existingUser.services = { resume: { loginTokens: [] }};
            if (!existingUser.services.resume)
                existingUser.services.resume = { loginTokens: [] };

            // copy accross new service info
            existingUser.services[service] = user.services[service];
            if (user.services.resume)
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

    // used to be onCreateUser (now moved to bottom)
    for (func in AccountsExtra.hooks.beforeCreateUser)
        AccountsExtra.hooks.onCreateUser[func](user, serviceArgs);

    var options = AccountsExtra.options;

    if (!user.profile.name && email && options.profileNameEmailFallback)
        user.profile.name = email.split('@')[0];
    if (!user.profile.name && options.profileNameTextFallback)
        user.profile.name = options.profileNameTextFallback;

    if (!user.profile.pic && options.profilePicFallback)
        user.profile.pic = options.profilePicFallback;

    if (!user.createdAt && AccountsExtra.saveCreatedAt)
        user.createdAt = new Date();

    for (func in AccountsExtra.hooks.onCreateUser)
        AccountsExtra.hooks.onCreateUser[func](user, serviceArgs);

    // if we're merging, delete existing record so we can return a user
    // object with same _id, that Meteor will go on to insert (this is 'safe',
    // I promise).
    if (existingUser)
        Meteor.users.remove({_id: user._id});

    // insert new record, or reinsert old record (with identical _id)
    return user;
});
