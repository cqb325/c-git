import GitRepo from './repo';

/**
 * Git Client Class
 * @public
 */
class GitClient {
    /**
     * create a git client with root dir and credential info
     * @param {String} dir
     * @param {Object} credentials optional
     */
    constructor (dir, credentials) {
        this.dir = dir;
        this.credentials = credentials;
    }

    /**
     * init a git repo
     */
    async init () {
        await GitRepo.init(this.dir);
    }

    /**
     * clone a git repo
     * @param {String} url
     * @param {String} branchName
     */
    async clone (url, branchName) {
        if (!branchName) {
            branchName = 'master';
        }

        await GitRepo.clone(url, branchName, this.dir, this.credentials);
    }

    /**
     * get commits from remote and merge with local changes
     */
    async pull () {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.pull();
        } finally {
            repo.free();
        }
    }

    /**
     * fetch commits
     * @param {String} remoteName
     */
    async fetch (remoteName) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.fetch(remoteName);
        } finally {
            repo.free();
        }
    }

    /**
     * fetch commits from all remotes
     */
    async fetchAll () {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.fetchAll();
        } finally {
            repo.free();
        }
    }

    /**
     * push commits to remote
     */
    async push () {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.push();
        } finally {
            repo.free();
        }
    }

    /**
     * add files to index
     * @param {String|Array} pathspec
     *  - Array: file path list
     *  - String: file path or glob rule
     */
    async add (pathspec) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.add(pathspec);
        } finally {
            repo.free();
        }
    }

    /**
     * reset files from index to last commit
     * @param {String|Array} pathspec
     *  - Array: file path list
     *  - String: file path or glob rule
     */
    async reset (pathspec) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.reset(pathspec);
        } finally {
            repo.free();
        }
    }

    async resetToCommit (id, type) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            return await repo.resetToCommit(id, type);
        } finally {
            repo.free();
        }
    }

    /**
     * remove files from index
     * @param {String|Array} pathspec
     *  - Array: file path list
     *  - String: file path or glob rule
     */
    async remove (pathspec) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.remove(pathspec);
        } finally {
            repo.free();
        }
    }

    async clearIndex () {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.clearIndex();
        } finally {
            repo.free();
        }
    }

    /**
     * commit a message
     * @param {String} message
     * @param {Object} options
     */
    async commit (message, paths, options) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.commit(message, paths, options);
        } finally {
            repo.free();
        }
        return ret;
    }

    async getCommit (id) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            const res = await repo.getCommitInfo(id);
            ret = res.commit;
        } finally {
            repo.free();
        }
        return ret;
    }

    async checkout (branchName) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.checkout(branchName);
        } finally {
            repo.free();
        }
    }

    /**
     * get status of index and work directory
     * @param {Boolean} untracted
     * @returns {Array}
     */
    async getStatus (untracted) {
        const repo = new GitRepo(this.dir, this.credentials);
        let list;
        try {
            await repo.open();
            list = await repo.getStatus(untracted);
        } finally {
            repo.free();
        }
        return list;
    }

    /**
     * get branches info
     * @returns {Array}
     */
    async getBranches () {
        const repo = new GitRepo(this.dir, this.credentials);
        let branches;
        try {
            await repo.open();
            branches = await repo.getBranches();
        } finally {
            repo.free();
        }
        return branches;
    }

    async getRemotes () {
        const repo = new GitRepo(this.dir, this.credentials);
        let remotes;
        let ret;
        try {
            await repo.open();
            remotes = await repo.getRemotes();
            if (remotes && remotes.length) {
                ret = [];
                for (const i in remotes) {
                    const remote = await repo.getRemote(remotes[i]);
                    ret.push(remote);
                }
            }
        } finally {
            repo.free();
        }
        return ret;
    }

    /**
     * 获取远程信息
     * @param {*} name 
     */
    async getRemote (name) {
        const repo = new GitRepo(this.dir, this.credentials);
        let remote;
        try {
            await repo.open();
            remote = await repo.getRemote(name);
        } finally {
            repo.free();
        }
        return remote;
    }

    async getTags () {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            const tags = await repo.getTags();
            if (tags && tags.length) {
                ret = [];
                for (const i in tags) {
                    const tag = await repo.getTag(tags[i]);
                    ret.push(tag);
                }
            }
        } finally {
            repo.free();
        }
        return ret;
    }

    async addTag (params) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.addTag(params);
        } finally {
            repo.free();
        }
    }

    async deleteTag (name) {
        const repo = new GitRepo(this.dir, this.credentials);
        try {
            await repo.open();
            await repo.deleteTag(name);
        } finally {
            repo.free();
        }
    }

    /**
     * 获取提交历史
     */
    async getCommitHistory () {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getCommitHistory();
        } finally {
            repo.free();
        }
        return ret;
    }

    async getFileCommitHistory (historyFile) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getFileCommitHistory(historyFile);
        } finally {
            repo.free();
        }
        return ret;
    }

    async getCommitInfo (oid) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getCommitInfo(oid);
        } finally {
            repo.free();
        }
        return ret;
    }

    async ignoreDir (dirName) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.ignoreRule(dirName);
        } finally {
            repo.free();
        }
        return ret;
    }

    async addIgnore (rule) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.ignoreRule(rule);
        } finally {
            repo.free();
        }
        return ret;
    }

    /**
     * 
     */
    async discardFile (filePath) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.checkOutFile(filePath);
        } finally {
            repo.free();
        }
        return ret;
    }

    async stash (message, options) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.stash(message, options);
        } finally {
            repo.free();
        }
        return ret;
    }

    async stashPop (index) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.stashPop(index);
        } finally {
            repo.free();
        }
        return ret;
    }

    async stashDrop (index) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.stashDrop(index);
        } finally {
            repo.free();
        }
        return ret;
    }

    async stashApply (index) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.stashApply(index);
        } finally {
            repo.free();
        }
        return ret;
    }

    async getIndexFiles () {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getIndexFiles();
        } finally {
            repo.free();
        }
        return ret;
    }

    async getDiffText (filePath) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getDiffText(filePath);
        } finally {
            repo.free();
        }
        return ret;
    }

    async editMessage (message, oid) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.editMessage(message, oid);
        } finally {
            repo.free();
        }
        return ret;
    }

    async deleteBranch (name) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.deleteBranch(name);
        } finally {
            repo.free();
        }
        return ret;
    }

    async hasBranchName (name) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.hasBranchName(name);
        } finally {
            repo.free();
        }
        return ret;
    }

    async getRemoteName (name) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.getRemoteName(name);
        } finally {
            repo.free();
        }
        return ret;
    }

    async setUpstream (branchName, targetName) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.setUpstream(branchName, targetName);
        } finally {
            repo.free();
        }
        return ret;
    }

    async review (branchName) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.review(branchName);
        } finally {
            repo.free();
        }
        return ret;
    }

    async deleteRemote (refName) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.deleteRemote(refName);
        } finally {
            repo.free();
        }
        return ret;
    }

    async setRemoteURL (remoteName, url) {
        const repo = new GitRepo(this.dir, this.credentials);
        let ret;
        try {
            await repo.open();
            ret = await repo.setRemoteURL(remoteName, url);
        } finally {
            repo.free();
        }
        return ret;
    }
}

GitClient.GitRepo = GitRepo;

export default GitClient;
