import {observable, action} from 'mobx';
import GitClient from '../utils/git';

export default class History {
    @observable data = null;

    async getHistory (cwd, filePath) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
        let data;
        if (filePath) {
            data = await this.client.getFileCommitHistory(filePath);
        } else {
            data = await this.client.getCommitHistory();
        }
        console.log(data);
        this.setData(data);
    }

    async reset (id, type) {
        await this.client.resetToCommit(id, type);
        await this.getHistory(this.cwd);
    }

    async getCommit (id) {
        return await this.client.getCommit(id);
    }

    async push () {
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
}
