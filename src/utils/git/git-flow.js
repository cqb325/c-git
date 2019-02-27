const {remote, ipcRenderer} = require('electron');
const Git = remote.getGlobal('Git');
const nodegit = require('nodegit-flow')(Git);

const {Flow, Repository} = nodegit;

class GitFlow {
    /**
     * 
     * @param {*} dir 
     */
    constructor (dir) {
        this.dir = dir;
    }

    async init () {
        const repo = await Repository.open(this.dir);
        this.repo = repo;
        return this;
    }

    isInitialized () {
        return Flow.isInitialized(this.repo);
    }

    getDefaultConfig () {
        return Flow.getConfigDefault();
    }

    getConfig () {
        return Flow.getConfig(this.repo);
    }

    install (params) {
        this.flow = Flow.init(this.repo, params);
    }

    free () {
        this.repo.free();
        this.flow = null;
    }

    /**
     * finish Feature
     * @param {*} params 
     */
    async finishFeature (params) {
        const config = await this.getConfig();
        const name = params.name.replace(config['gitflow.prefix.feature'], '');
        return new Promise((resolve, reject) => {
            ipcRenderer.send('finishFeature', this.dir, name, params.message);
            ipcRenderer.once('finishFeature_res', (event, err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async finishRelease (params) {
        const config = await this.getConfig();
        const name = params.name.replace(config['gitflow.prefix.release'], '');
        return new Promise((resolve, reject) => {
            ipcRenderer.send('finishRelease', this.dir, name, params.message);
            ipcRenderer.once('finishRelease_res', (event, err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async finishHotFix (params) {
        const config = await this.getConfig();
        const name = params.name.replace(config['gitflow.prefix.hotfix'], '');
        return new Promise((resolve, reject) => {
            ipcRenderer.send('finishHotFix', this.dir, name, params.message);
            ipcRenderer.once('finishHotFix_res', (event, err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    validateConfig (params) {
        return Flow.validateConfig(params);
    }
}

export default GitFlow;
