import {observable, action} from 'mobx';
import GitClient from '../utils/git';
import GitFlow from '../utils/git/git-flow';
export default class Branches {
    @observable selectedNode = null;
    @observable selectedSubNode = null;
    @observable data = null;

    async getOrigns (brancheData, cwd) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
        brancheData.branches.forEach(branche => {
            if (branche.head) {
                this.setSelectedSubNode(branche.ref);
            }
        });
        brancheData.flows && brancheData.flows.forEach(branche => {
            if (branche.head) {
                this.setSelectedSubNode(branche.ref);
            }
        });
        const map = {};
        brancheData.remotes.forEach(remote => {
            if (!map[remote.remote]) {
                map[remote.remote] = [];
            }
            map[remote.remote].push(remote);
        });
        brancheData.remotes = map;
        this.setData(brancheData);
    }

    /**
     * pop stash
     * @param {*} index 
     */
    async stashPop (index) {
        if (this.client) {
            const ret = await this.client.stashPop(index);
            if (ret === 0) {
                // 成功 刷新Branches
                // this.getOrigns(this.cwd);
            }
            return ret;
        } else {
            console.error('no git client');
        }
    }

    /**
     * drop stash
     * @param {*} index 
     */
    async stashDrop (index) {
        await this.client.stashDrop(index);
    }

    /**
     * apply stash
     * @param {*} index 
     */
    async stashApply (index) {
        await this.client.stashApply(index);
    }

    async pull () {
        await this.client.pull();
    }

    async checkoutBranch (name) {
        await this.client.checkout(name);
    }

    async deleteBranch (name) {
        await this.client.deleteBranch(name);
    }

    async deleteTag (name) {
        await this.client.deleteTag(name);
    }

    async hasBranchName (name) {
        return await this.client.hasBranchName(name);
    }

    async getRemoteName (name) {
        return await this.client.getRemoteName(name);
    }

    async setUpstream (branchName, remoteName) {
        await this.client.setUpstream(branchName, remoteName);
    }

    async stopTracking (branchName) {
        await this.client.setUpstream(branchName, null);
    }

    /**
     * review 提交到gerrity等
     * @param {*} branchName 
     */
    async review (branchName) {
        return await this.client.review(branchName);
    }

    async deleteRemote (refName) {
        await this.client.deleteRemote(refName);
    }

    async getRemotes () {
        return await this.client.getRemotes();
    }

    async getRemote (name) {
        return await this.client.getRemote(name);
    }

    async setRemoteURL (data) {
        await this.client.setRemoteURL(data.name, data.url);
    }

    async finishFeature (params) {
        const gitFlow = new GitFlow(this.cwd);
        await gitFlow.init();
        await gitFlow.finishFeature(params);
    }

    async finishRelease (params) {
        const gitFlow = new GitFlow(this.cwd);
        await gitFlow.init();
        await gitFlow.finishRelease(params);
    }

    async finishHotFix (params) {
        const gitFlow = new GitFlow(this.cwd);
        await gitFlow.init();
        await gitFlow.finishHotFix(params);
    }

    @action
    setSelectedNode (nodeId) {
        this.selectedNode = nodeId;
    }

    @action
    setSelectedSubNode (nodeId) {
        this.selectedSubNode = nodeId;
    }

    @action
    setData (data) {
        this.data = data;
    }
}
