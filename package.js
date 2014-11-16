Package.describe({
	name: 'gadicohen:accounts-merge',
	version: '0.0.1',
	summary: 'Let user login to and add multiple services to one account'
});

// TODO, move each to a seperate package?
Npm.depends({
	"github": "0.1.12",
	"googleapis": "0.4.7",
	"fbgraph": "0.2.10"
});

Package.on_use(function (api) {
	if (api.versionsFrom) {
		api.versionsFrom('0.9.4');
		api.use('meteorhacks:npm@1.2.0', 'server');
	} else {
		api.use('npm', 'server');
	}

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

	api.add_files('services.js', 'server');
	api.export('AccountsExtra', 'server');

	api.add_files('avatar-empty.png', 'client');
});
