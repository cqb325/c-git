const {remote} = require('electron');
const path = require('path');
const fs = require('fs');
const shell = remote.shell;
const cp = require('child_process');
const Configstore = require('configstore');
const gitConfigPath = require('git-config-path');
const parseConfig = require('parse-git-config').sync;
const ini = require('ini');
import gitConfig from './git/git-config';

export default class Utils {
    static openDir (cwd, relative) {
        const dirPath = path.join(cwd, relative);
        shell.openItem(dirPath);
    }

    static openTerminal (dir) {
        cp.spawn('cmd', ['/c', 'start', 'pushd', dir]);
    }

    /**
     * 将目录加入到gitignore文件中
     * @param {*} dir 
     */
    static ignoreDirectory (cwd, dir) {
        const dirName = `/${path.basename(dir)}`;
        const filePath = `${cwd}/.gitignore`;
        try {
            fs.appendFileSync(filePath, '\n');
            fs.appendFileSync(filePath, `${dirName}\n`);
            return dirName;
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    static ignoreRule (cwd, rule) {
        const filePath = `${cwd}/.gitignore`;
        try {
            fs.appendFileSync(filePath, '\n');
            fs.appendFileSync(filePath, `${rule}\n`);
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    static getDefaultCommit (cwd) {
        const config = gitConfig(cwd);
        if (config.commit && config.commit.template) {
            try {
                fs.accessSync(config.commit.template, fs.constants.F_OK);
                const data = fs.readFileSync(config.commit.template, 'utf8');
                return data;
            } catch (e) {
                console.error(`${config.commit.template}不存在`);
            }
        }
        return null;
    }

    static decodeStr (buf) {
        return decodeURI(buf.replace(/\\\d{3}/g, (a) => {
            const num = a.substr(1);
            let code = Number(parseInt(num, 8)).toString(16);
            code = `%${(`${code}`).toUpperCase()}`;
            return code;
        }));
    }

    static isGitDir (dir) {
        try {
            fs.accessSync(dir, fs.constants.F_OK);
            // 存在目录
        } catch (e) {
            // 不存在 目录
            return 'NOACCESS';
        }
        try {
            fs.accessSync(`${dir}/.git`, fs.constants.F_OK);
            // 存在git目录
        } catch (e) {
            // 不存在git目录
            return 'NOGIT';
        }
        return 'OK';
    }
    
    static getRepoInfo (dir) {
        const config = gitConfig(dir);
        let keys = Object.keys(config);
        keys = keys.filter((item) => {
            return item.indexOf('remote') !== -1;
        });
        const remoteKey = keys[0] || '';
        let name;
        if (config[remoteKey]) {
            const url = config[remoteKey].url;
            name = path.basename(url, '.git');
            console.log(name);
        } else {
            name = path.basename(dir);
        }

        const ret = {name};
        if (config.user) {
            ret.user = config.user;
        }
        return ret;
    }

    static getRepoConfig (dir) {
        const config = gitConfig(dir);
        const store = new Configstore('c-git');
        const item = Utils.getItemByPath(store, dir);
        config.author = item.auth;
        
        return config;
    }

    static saveConfig (dir, params) {
        const store = new Configstore('c-git');
        const item = Utils.getItemByPath(store, dir);
        item.auth.username = params.username;
        item.auth.password = params.password;

        store.set(item.name, item);

        const configPath = gitConfigPath({cwd: dir});
        const cfg = parseConfig({cwd: configPath, path: configPath});
        cfg.user = {
            name: params['user.name'],
            email: params['user.email']
        };
        fs.writeFileSync(configPath, ini.stringify(cfg, {whitespace: true}));
    }

    /**
     * 获取ignore的类型
     */
    static fetchIgnoreTypes () {
        let files = fs.readdirSync('./ignores');
        files = files.map(file => {
            return file.replace('.gitignore', '');
        });
        return files;
    }

    static createIngoreFile (type, dir) {
        try {
            fs.accessSync(`./ignores/${type}.gitignore`, fs.constants.F_OK);
            // 存在该文件
            const file = path.join(dir, '.gitignore');
            const content = fs.readFileSync(`./ignores/${type}.gitignore`);
            fs.writeFileSync(file, content);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * 地址是http的但是没有设置用户名密码
     * @param {*} cwd 
     */
    static hasHttpPass (cwd) {
        const config = gitConfig(cwd);
        const store = new Configstore('c-git');
        const item = Utils.getItemByPath(store, cwd);
        let keys = Object.keys(config);
        keys = keys.filter((item) => {
            return item.indexOf('remote') !== -1;
        });
        const remoteKey = keys[0] || '';
        if (config[remoteKey]) {
            const url = config[remoteKey].url;
            if (url.indexOf('http') !== -1) {
                const auth = item.auth;
                if (!auth.username || !auth.password) {
                    return false;
                }
            }
        }
        return true;
    }

    static getItemByPath (store, dir) {
        for (const name in store.all) {
            const item = store.all[name];
            if (item.dir === dir) {
                return item;
            }
        }
        return null;
    }

    /**
     * 设置用户名密码
     * @param {*} cwd 
     * @param {*} params 
     */
    static saveAuthentication (cwd, params) {
        const store = new Configstore('c-git');
        const item = Utils.getItemByPath(store, cwd);
        item.auth.username = params.username;
        item.auth.password = params.password;
        store.set(item.name, item);
    }

    /**
     * 是否存在review
     * @param {*} cwd 
     */
    static hasReview (cwd) {
        try {
            fs.accessSync(path.join(cwd, '.gitreview'));
            return true;
        } catch (e) {
            return false;
        }
    }
}
