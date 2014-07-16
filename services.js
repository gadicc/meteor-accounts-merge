/*
 * TODO
 * - think about services that only provide email with oauth
 * - only do oauth request of configuration and circumstances
 *   require it (use a function to make request and catch it)
 */

/*
 * facebook: appId, secret
 * github: clientId, secret
 * google: clientId, secret
 */
var loginServiceConf = {};
Meteor.startup(function() {
	ServiceConfiguration.configurations.find().observe({
	  'added': function(doc) {
	    loginServiceConf[doc.service] = doc

	    // init google oauth client
	    if (doc.service == 'google')
	      goauth2client = new googleapis.OAuth2Client(
	        doc.clientId, doc.secret, process.env.ROOT_URL);
	  }
	});
});

// google
var googleapis = Npm.require('googleapis');
var goauth2client; // init on account observe
var gclient; // init below on discover

googleapis
  .discover('plus', 'v1')
  .execute(function(err, client) {
    gclient = client;
});

AccountsExtra.services.google = function(user, serviceInfo) {

	console.log(serviceInfo);

	goauth2client.credentials = {
      access_token: user.services.google.accessToken
    };

  var res = Meteor.sync(function(done) {
      gclient
      .plus.people.get({ userId: 'me' })
      .withAuthClient(goauth2client)
      .execute(done)
  });
  res = res.result;

  var options = AccountsExtra.options;

  if (options.saveProfileName &&
  		(!user.profile.name || options.overwriteExistingProfileName))
  	user.profile.name = serviceInfo.name;

  if (options.saveProfilePic &&
  		((!user.profile.pic || user.profile.pic == options.profilePicFallback)
  		 || options.overwriteExistingProfilePic))
  	user.profile.pic = serviceInfo.picture;


  if (options.saveLocation)
  	user.profile.location = res.placesLived[0].value;

  if (options.saveServiceUsername)
  	user.profile.gplus = serviceInfo.id;

  return {
  	user: res,
  	gclient: gclient,
  	auth2client: goauth2client
  };
}

// github
var Github = Npm.require('github');
var github = new Github({version: "3.0.0"});
github.user = Async.wrap(github.user, ['get']);

AccountsExtra.services.github = function(user, serviceInfo) {

  github.authenticate({
      type: "oauth",
      token: user.services.github.accessToken
  });

  var res = github.user.get({});
  var options = AccountsExtra.options;

  if (options.saveProfileName &&
  		(!user.profile.name || options.overwriteExistingProfileName))
  	user.profile.name = serviceInfo.username;

  if (options.saveProfilePic &&
  		((!user.profile.pic || user.profile.pic == options.profilePicFallback)
  		 || options.overwriteExistingProfilePic))
  	user.profile.pic = res.avatar_url;

  if (options.saveServiceUsername)
  	user.profile.github = serviceInfo.username;

  if (options.saveLocation)
  	user.profile.location = res.location;

  return {
  	user: res,
  	github: github
  }

}

// facebook
var fbgraph = Npm.require('fbgraph');
fbgraph.get = Async.wrap(fbgraph.get);

AccountsExtra.services.facebook = function(user, serviceInfo) {
  var options = AccountsExtra.options;
	var res = fbgraph.get('me?fields=location&access_token='
      + serviceInfo.accessToken);

  if (options.saveProfileName &&
  		(!user.profile.name || options.overwriteExistingProfileName))
  	user.profile.name = serviceInfo.name;

  if (options.saveProfilePic &&
			((!user.profile.pic || user.profile.pic == options.profilePicFallback)
  		 || options.overwriteExistingProfilePic))
  	user.profile.pic = '//graph.facebook.com/'+serviceInfo.id+'/picture';

  if (options.saveServiceUsername)
  	user.profile.facebook = serviceInfo.username;

  if (options.saveLocation && res.location)
  	user.profile.location = res.location.name;

  return {
  	user: res,
  	fbgraph: fbgraph
  }
}
