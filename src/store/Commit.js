import {observable, action} from 'mobx';
import GitClient from '../utils/git';

export default class Commit {
    @observable data = null;
    @observable diffText = '';
    cwd = '';
    client = null;

    setCwd (cwd) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
    }
    
    async getCommitInfo (oid) {
        const data = await this.client.getCommitInfo(oid);
        this.setData(data);
    }

    @action
    setData (data) {
        this.data = data;
    }

    @action
    setDiffText (diffText) {
        this.diffText = diffText;
    }
}
