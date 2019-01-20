/* global Package*/
Package.describe({
    name: 'socialize:user-blocking',
    version: '1.0.3',
    summary: 'Allow users to block each other',
    git: 'https://github.com/copleykj/socialize-user-blocking.git',
});

Package.onUse(function _(api) {
    api.versionsFrom('1.3');
    api.use([
        'check',
        'reywood:publish-composite@1.7.0',
        'socialize:user-model@1.0.2',
    ]);
    api.imply('socialize:user-model');
    api.mainModule('server/server.js', 'server');
    api.mainModule('common/common.js', 'client');
});
