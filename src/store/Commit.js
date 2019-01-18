import {observable, action} from 'mobx';
import GitClient from '../utils/git';
import utils from '../utils/utils';

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

    async getDiffText (filePath) {
        // console.log(this.data.commit, filePath);
        // const diffs = await this.data.commit.getDiffWithOptions({flags: 8 | 16, pathspec: filePath});
        // console.log(diffs);
        // let diffText = '';
        // for (const i in diffs) {
        //     const diff = diffs[i];
        //     const buf = await diff.toBuf(1);
        //     diffText = utils.decodeStr(buf);
        // }
        // this.setDiffText(diffText);
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
