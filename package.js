Package.describe({
	summary: 'Let user login to and add multiple services to one account'
});

Package.on_use(function (api) {
	api.add_files('accounts-merge.js', ['client-server']);
});
