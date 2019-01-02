import {observable, action, toJS} from 'mobx';
import GitClient from '../utils/git';
import utils from '../utils/utils';

export default class Repo {
    @observable status = null;
    @observable template = null;
    @observable diffText = null;
    @observable selectedFiles = [];

    client = null;

    cwd = null;

    initClient (cwd) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
    }

    async getStatus (cwd) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
        const status = await this.client.getStatus(true);
        
        this.setStatus(status);
    }

    async discardFile () {
        const paths = this.selectedFiles.map(item => {
            return item.path;
        });
        await this.client.discardFile(paths);
        await this.getStatus(this.cwd);
    }

    async stage () {
        const paths = this.selectedFiles.map(item => {
            return item.path;
        });
        await this.client.add(paths);
        await this.getStatus(this.cwd);
    }

    async unStage () {
        const paths = this.selectedFiles.map(item => {
            return item.path;
        });
        await this.client.reset(paths);
        await this.getStatus(this.cwd);
    }

    async stashFiles (message) {
        const oid = await this.client.stash(message);
        await this.getStatus(this.cwd);
        return oid;
    }

    async ignore (rule) {
        utils.ignoreRule(this.cwd, rule);
        await this.client.addIgnore(rule);
    }

    async commit (states, message) {
        return await this.client.commit(message, states);
    }

    async getIndexFiles () {
        return await this.client.getIndexFiles();
    }

    async clearIndex () {
        await this.client.clearIndex();
    }

    async getDiffText (filePath) {
        const diffText = await this.client.getDiffText(filePath);
        this.setDiffText(diffText);
    }

    /**
     * 获取默认的提交模板
     */
    getDefaultCommitTemplate (cwd) {
        const temp = utils.getDefaultCommit(cwd);
        this.setCommitTemplate(temp);
    }

    @action
    addAllSelectFile (files) {
        if (!this.selectedFiles) {
            this.selectedFiles = [];
        }
        if (files instanceof Array) {
            this.selectedFiles = files;
        } else {
            this.selectedFiles.push(files);
        }
    }

    @action
    removeSelectFile (state) {
        const arr = toJS(this.selectedFiles);
        let index = -1;
        for (const i in arr) {
            if (state.path === arr[i].path) {
                index = i;
                break;
            }
        }
        arr.splice(index, 1);
        this.selectedFiles = arr;
    }

    @action
    addSelectFile (state) {
        this.selectedFiles.push(state);
    }

    @action
    setCurrentFile (state) {
        this.selectedFiles = [state];
    }

    @action
    setStatus (status) {
        this.status = status;
    }

    @action
    setCommitTemplate (template) {
        this.template = template;
    }

    @action
    setDiffText (diffText) {
        this.diffText = diffText;
    }
}
