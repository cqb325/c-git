import {observable, action} from 'mobx';
import GitClient from '../utils/git';

export default class History {
    @observable data = null;
    @observable loading = false;

    async getHistory (cwd, filePath) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
        let data;
        this.startHistory();
        if (filePath) {
            data = await this.client.getFileCommitHistory(filePath);
        } else {
            data = await this.client.getCommitHistory();
        }
        this.setData(data);
    }

    async reset (id, type) {
        this.startHistory();
        await this.client.resetToCommit(id, type);
        await this.getHistory(this.cwd);
    }

    async getCommit (id) {
        return await this.client.getCommit(id);
    }

    async push () {
        this.startHistory();
        await this.client.push();
    }

    async editMessage (message, oid) {
        await this.client.editMessage(message, oid);
    }

    async addTag (params) {
        await this.client.addTag(params);
    }

    @action
    setData (data) {
        this.data = data;
    }

    @action
    startHistory () {
        this.loading = true;
    }

    @action
    endHistory () {
        this.loading = false;
    }
}
