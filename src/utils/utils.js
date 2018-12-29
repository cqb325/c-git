const {remote} = require('electron');
const path = require('path');
const fs = require('fs');
const shell = remote.shell;
const cp = require('child_process');
const parse = require('parse-gitignore');
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
}
