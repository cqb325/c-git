import {observable, action} from 'mobx';
import GitClient from '../utils/git';
export default class Branches {
    @observable selectedNode = null;
    @observable selectedSubNode = null;
    @observable data = null;

    async getOrigns (cwd) {
        if (this.cwd !== cwd) {
            this.cwd = cwd;
            this.client = new GitClient(cwd);
        }
        const origns = await this.client.getRemotes();
        const brancheData = await this.client.getBranches();
        brancheData.branches.forEach(branche => {
            if (branche.head) {
                this.setSelectedSubNode(branche.ref);
            }
        });
        const data = [];
        data.push({
            ref: 'local', name: 'Local Branches', type: 'local', children: brancheData.branches
        });
        this.setSelectedNode('local');
        const map = {};
        brancheData.remotes.forEach(remote => {
            if (!map[remote.remote]) {
                map[remote.remote] = [];
            }
            map[remote.remote].push(remote);
        });
        origns && origns.forEach(origin => {
            data.push({
                ref: `orign_${origin.name}`, type: 'remote', name: origin.name, children: map[origin.name]
            });
        });
        data.push({
            ref: 'tags', name: 'Tags', type: 'tag', children: brancheData.tags
        });
        if (brancheData.stashes && brancheData.stashes.length) {
            data.push({
                ref: 'stashes', name: 'Stashes', type: 'stash', children: brancheData.stashes
            });
        }
        this.setData(data);
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
