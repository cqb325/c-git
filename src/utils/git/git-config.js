const fs = require('fs');
const path = require('path');
const extend = require('extend');
const getGitConfigPath = require('git-config-path');
const parseConfig = require('parse-git-config').sync;

export default function (dir) {
    const globalPath = getGitConfigPath('global');
    
    let config = {};
    if (fs.existsSync(globalPath)) {
        config = parseConfig({cwd: '/', path: globalPath});
    }

    if (dir) {
        const newConfig = parseConfig(path.join(dir, '.git', 'config'));
        extend(true, config, newConfig);
    }
    console.log(config);

    return config;
}
