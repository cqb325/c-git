import {observable, action} from 'mobx';
const chokidar = require('chokidar');
const fs = require('fs');
const parse = require('parse-gitignore');

export default class Repo {
    @observable cwd = '';
    @observable historyFile = '';

    watcher = null;
    gitWatcher = null;

    getIgnored (dir) {
        try {
            fs.accessSync(`${dir}/.gitignore`, fs.constants.F_OK);
            const str = fs.readFileSync(`${dir}/.gitignore`, 'utf8');
            let res = parse(str);
            res.push('.git/objects');
            res = res.map((item) => {
                item = item.replace('.', '\\.');
                item = item.replace('*', '.');
                return item;
            });
            return res;
        } catch (e) {
            return ['\\.git\/objects'];
        }
    }

    closeWatch () {
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.gitWatcher) {
            this.gitWatcher.close();
        }
    }

    setCurrentRepo (cwd, callback, callback2) {
        try {
            fs.accessSync(cwd, fs.constants.F_OK);
            // 存在目录
        } catch (e) {
            // 不存在 目录
            this.setCwd('');
            sessionStorage.setItem('current_repo_cwd', '');
            throw new Error(`${cwd} 该目录不存在`);
        }
        try {
            fs.accessSync(`${cwd}/.git`, fs.constants.F_OK);
            // 存在git目录
        } catch (e) {
            this.setCwd('');
            sessionStorage.setItem('current_repo_cwd', '');
            throw new Error(`${cwd} 该目录不是一个git仓库`);
            // 不存在目录
        }
        if (this.cwd !== cwd) {
            if (this.watcher) {
                this.watcher.unwatch(this.cwd);
            }
            if (this.gitWatcher) {
                this.gitWatcher.unwatch(`${this.cwd}/.git`);
            }

            const list = this.getIgnored(cwd);
            const ignoreRE = list.length ? new RegExp(list.join('|')) : null;
            let watchReady = false;
            this.watcher = chokidar.watch(cwd, { ignored: ignoreRE }).on('all', (event, path) => {
                if (callback && watchReady) {
                    callback(event, path);
                }
            });
            this.watcher.on('ready', () => {
                watchReady = true;
            });
            

            this.setCwd(cwd);
            callback2 ? callback2() : false;
        }
    }

    @action
    setHistoryFile (historyFile) {
        this.historyFile = historyFile;
    }

    @action
    setCwd (cwd) {
        this.cwd = cwd;
    }
}
