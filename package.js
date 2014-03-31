Package.describe({
	summary: 'Let user login to and add multiple services to one account'
});

// TODO, move each to a seperate package?
Npm.depends({
	"github": "0.1.12",
	"googleapis": "0.4.7",
	"googlemaps": "0.1.9",
	"fbgraph": "0.2.10"
});

Package.on_use(function (api) {
	api.use(['accounts-base', 'service-configuration'], 'server');
	api.use('underscore', 'server');
	api.use(
		[
			'accounts-ui',
			'accounts-password',
			'accounts-facebook',
			'accounts-google',
			'accounts-github'
		],
		'server', { weak: true }
	);

	api.add_files('accounts-merge.js', 'server');

	api.use('npm', 'server');
	api.add_files('services.js', 'server');
	api.export('AccountsExtra', 'server');

	api.add_files('avatar-empty.png', 'client');
});
