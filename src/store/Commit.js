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

    async saveFileAs (sha1, filePath, targetDir) {
        const data = await this.client.getFileBlob(sha1, filePath);
        if (data) {
            const targetPath = `${targetDir}/${data.name}`;
            utils.writeFile(data.content, targetPath);
        }
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
