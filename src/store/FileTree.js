import {observable, action} from 'mobx';
import directoryTree from '../utils/directoryTree';
import GitClient from '../utils/git';
import utils from '../utils/utils';
const ignored = require('ignored');
const fs = require('fs');
const path = require('path');
let exclude = [];

export default class FileTree {
    @observable data = null;
    @observable currentDir = '';

    cwd = '';

    async getIgnored (dir) {
        return await new Promise((resolve, reject) => {
            try {
                fs.accessSync(`${dir}/.gitignore`, fs.constants.F_OK);
                ignored(`${dir}/.gitignore`, (err, list) => {
                    if (!err) {
                        list.push('.git');
                        list = list.filter(el => !!el);
                        exclude = list.map(item => {
                            item = item.replace('.', '\\.');
                            item = item.replace('*', '.');
                            return new RegExp(item);
                        });
                        resolve(exclude);
                    } else {
                        reject(err);
                    }
                });
            } catch (err) {
                console.log('.gitignore不存在');
                exclude = [new RegExp('\\.git')];
                resolve();
            }
        });
    }

    async getRepoTree (dir) {
        if (!this.client) {
            this.client = new GitClient(dir);
        }
        if (this.cwd !== dir) {
            this.client = new GitClient(dir);
        }
        this.cwd = dir;
        await this.getIgnored(dir);
        const ret = directoryTree(dir, {normalizePath: true, exclude});
        if (ret) {
            ret.open = 1;
            this.rebuildData([ret]);
            this.setData([ret]);
        }
    }

    rebuildData (data) {
        if (data) {
            data.forEach(item => {
                item.id = item.path,
                item.text = item.name;
                if (item.children) {
                    this.rebuildData(item.children);
                }
            });
        }
    }

    async ignoreDir (dirName) {
        await this.client.ignoreDir(dirName);
        await this.getRepoTree(this.cwd);
    }

    async pull () {
        await this.client.pull();
    }

    getConfig () {
        const config = utils.getRepoConfig(this.cwd);
        return config;
    }

    async saveConfig (params) {
        await utils.saveConfig(this.cwd, params);
    }

    @action
    setData (data) {
        this.data = data;
        this.currentDir = path.relative(this.cwd, data[0].path);
    }

    @action
    setCurrentDir (dir) {
        this.currentDir = dir;
    }
}
