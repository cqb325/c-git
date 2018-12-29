const paths = require('./paths');

let alias = {};

alias = Object.assign(alias, {
    'r-cmui': `${paths.appSrc}/r-cmui`
});

module.exports = alias;
