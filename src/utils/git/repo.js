const {remote, ipcRenderer} = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs');
const nodegit = remote.getGlobal('Git');
const flowgit = require('nodegit-flow')(nodegit);
const {Flow} = flowgit;

const GitResetDefault = remote.getGlobal('GitResetDefault');
const simpleGit = require('simple-git');
import gitConfig from './git-config';
import store from 'store';

const {
    Clone,
    Repository,
    Branch,
    Status,
    Stash,
    Cred,
    Tag,
    Checkout,
    Revwalk,
    Ignore,
    Remote,
    AnnotatedCommit,
    Reference
} = nodegit;


/**
 * default credentials value
 */
const DEFAULT_CREDENTIALS = {
    type: 'ssh',
    privateKey: path.join(os.homedir(), '.ssh', 'id_rsa'),
    publicKey: path.join(os.homedir(), '.ssh', 'id_rsa.pub'),
    passphrase: '',
    username: '',
    password: ''
};

class Repo {
    /**
     * create GitRepo instance
     *
     * @param {String} dir
     * @param {Object} credentials (optional)
     */
    constructor (dir, credentials) {
        this.dir = dir;
        this.rawRepo = null;
        this.credentials = Object.assign(DEFAULT_CREDENTIALS, credentials);
        this.id = Repo._lastRepoId++;
    }

    static fetchOptions (credentials) {
        credentials = Object.assign({}, DEFAULT_CREDENTIALS, credentials);

        const callbacks = {};
        if (process.platform === 'darwin') {
            callbacks.certificateCheck = () => 1;
        }
        callbacks.credentials = (url, username) => {
            if (credentials.type === 'ssh') {
                return Cred.sshKeyNew(
                    username,
                    credentials.publicKey,
                    credentials.privateKey,
                    credentials.passphrase
                );
            } else if (credentials.type === 'http') {
                return Cred.userpassPlaintextNew(credentials.username, credentials.password);
            } else {
                return Cred.usernameNew(username);
            }
        };

        return {
            callbacks
        };
    }

    /**
     * init git repo
     * @param {*} dir 
     */
    static async init (dir) {
        const repo = await Repository.init(dir, 0);
        repo.free();
    }

    /**
     * clone a repo
     * @param {String} gitUrl
     * @param {String} branch
     * @param {String} target
     * @param {Object} credentials
     */
    static async clone (gitUrl, branch, target, credentials) {
        const repo = await Clone(gitUrl, target, {
            checkoutBranch: branch,
            fetchOpts: this.fetchOptions(credentials)
        });

        repo.free();
    }

    /**
     * open a repo
     */
    async open () {
        // repo check
        const openRepos = Repo._openRepos;
        if (openRepos.indexOf(this.id) >= 0) {
            throw new Error(`repo ${this.dir} has arealdy been opened, you should call free() first`);
        }
        openRepos.push(this.id);

        this.rawRepo = await Repository.open(this.dir);

        // memory leak warning
        if (openRepos.length > 10) {
            console.warn('you have opened more than %s repos without call free(), this may cause memory leaks', openRepos.length);
        }
    }

    /**
     * free a repo (make sure aways call free() when git repo is useless)
     */
    free () {
        if (!this.rawRepo) {
            return;
        }

        this.rawRepo.free();
        this.rawRepo = null;

        // remove from openRepos
        const openRepos = Repo._openRepos;
        openRepos.splice(openRepos.indexOf(this.id), 1);
    }

    /**
     * get options for fetch
     */
    getFetchOptions () {
        return Repo.fetchOptions(this.credentials);
    }

    /**
     * fetch a repo from remote
     * @param {String} remoteName
     */
    async fetch (remoteName) {
        if (!remoteName) {
            remoteName = await this.getCurrentRemoteName();
        }

        await this.rawRepo.fetch(remoteName, this.getFetchOptions());
    }

    /**
     * fetch all remotes
     */
    async fetchAll () {
        await this.rawRepo.fetchAll(this.getFetchOptions());
    }

    /**
     * pull commits from remote (fetch and merge)
     */
    async pull () {
        // await this.fetchAll();

        // get current branch
        const branch = await this.rawRepo.getCurrentBranch();
        if (!branch.isHead()) {
            throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`);
        }

        // get branch upstream
        const upstream = await Branch.upstream(branch);
        await this.rawRepo.mergeBranches(branch, upstream);
    }

    /**
     * get branch upstream
     * @param {String} branchName
     * @returns {Object}
     */
    async getUpstream (branchName) {
        const branch = await this.rawRepo.getBranch(branchName);
        const upstream = await Branch.upstream(branch);
        if (upstream) {
            return {
                ref: upstream.name(),
                name: upstream.shorthand(),
                target: upstream.target().toString()
            };
        }
    }

    /**
     * set upstream to branch
     * @param {String} branchName
     * @param {String} upstreamName
     */
    async setUpstream (branchName, upstreamName) {
        const branch = await this.rawRepo.getBranch(branchName);
        await Branch.setUpstream(branch, upstreamName);
    }

    /**
     * get remote list
     * @returns {Array}
     */
    async getRemotes () {
        return await this.rawRepo.getRemotes();
    }
    
    /**
     * get remote info
     * @returns {Object}
     */
    async getRemote (name) {
        const remote = await this.rawRepo.getRemote(name);

        return {
            url: remote.url(),
            name: remote.name()
        };
    }

    async getTags () {
        return await Tag.list(this.rawRepo);
    }

    async getTag (name) {
        const hash = await AnnotatedCommit.fromRevspec(this.rawRepo, name);
        const commit = await this.rawRepo.getCommit(hash.id());
        const obj = {
            oid: commit.id(),
            hash: commit.id().toString(),
            name,
            date: commit.date(),
            author: commit.author(),
            committer: commit.committer(),
            message: commit.summary()
        };
        return obj;
    }

    /**
     * get remote name of current branch
     * @return {String}
     */
    async getCurrentRemoteName () {
        const branch = await this.rawRepo.getCurrentBranch();
        const upstream = await Branch.upstream(branch);

        return await Branch.remoteName(this.rawRepo, upstream.name());
    }

    /**
     * push commits to remote
     */
    async push () {
        // const cred = this.getFetchOptions();
        
        const branch = await this.rawRepo.getCurrentBranch();
        if (!branch.isHead()) {
            throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`);
        }

        const upstream = await Branch.upstream(branch);
        const remoteName = await Branch.remoteName(this.rawRepo, upstream.name());
        const remote = await this.rawRepo.getRemote(remoteName);
        const remoteBranchName = upstream.shorthand().replace(`${remoteName}/`, '');
        const refspec = `refs/heads/${branch.shorthand()}:refs/heads/${remoteBranchName}`;

        await remote.push([refspec], {
            callbacks: {
                credentials (url, userName) {
                    return nodegit.Cred.sshKeyFromAgent(userName);
                }
            }
        });
    }

    /**
     * add pathspec to index
     * @param {String|Array} pathspec
     */
    async add (pathspec) {
        const index = await this.rawRepo.refreshIndex();
        if (Array.isArray(pathspec)) {
            for (const file of pathspec) {
                const fullpath = path.join(this.dir, file);
                if (fs.existsSync(fullpath)) {
                    if (file.endsWith('/')) {
                        await index.addAll(file);
                    } else {
                        await index.addByPath(file);
                    }
                } else {
                    await index.removeByPath(file);
                }
            }
        } else {
            await index.addAll(pathspec);
        }

        await index.write();
        return await index.writeTree();
    }

    /**
     * reset index to head commit
     * @param {String|Array} pathspec
     */
    async reset (pathspec) {
        if (!Array.isArray(pathspec)) {
            pathspec = [pathspec];
        }

        const commit = await this.rawRepo.getHeadCommit();
        await GitResetDefault(this.rawRepo, commit, pathspec);
    }

    /**
     * reset to commit by type
     * @param {*} id 
     * @param {*} type 
     */
    async resetToCommit (id, type) {
        // const commit = await this.rawRepo.getCommit(id);
        const repo = simpleGit(this.dir);

        await new Promise((resolve, reject) => {
            repo.reset([`--${type}`, id], (ret) => {
                if (!ret) {
                    resolve();
                } else {
                    reject(ret);
                }
            });
        });
        // return await GitResetReset(this.rawRepo, commit, parseInt(type, 10));
    }

    /**
     * remove pathspec from index
     * @param {String|Array} pathspec
     */
    async remove (pathspec) {
        const index = await this.rawRepo.index();
        if (Array.isArray(pathspec)) {
            for (const file of pathspec) {
                await index.removeByPath(file);
            }
        } else {
            await index.removeAll(pathspec);
        }

        await index.write();
        await index.writeTree();
    }

    async clearIndex () {
        const index = await this.rawRepo.index();
        await index.clear();
    }

    /**
     * create commit on head
     * @param {String} message
     * @param {Object} options
     */
    async commit (message, paths, options) {
        // options = options || {};

        // let name = options.name || '';
        // let email = options.email || '';

        // if (!name || !email) {
        //     const config = gitConfig(this.dir);
        //     if (config.user) {
        //         name = name || config.user.name;
        //         email = email || config.user.email;
        //     }
        // }

        // const author = nodegit.Signature.now(name, email);
        // const committer = nodegit.Signature.now(name, email);
        // const commitId = await this.rawRepo.createCommitOnHead(paths, author, committer, message);
        // console.log(commitId);
        // // await this.rawRepo.createCommitOnHead([], author, author, message);
        // return commitId;

        await this.add(paths);
        const repo = simpleGit(this.dir);
        await new Promise((resolve, reject) => {
            const command = ['commit', '-m', message, '-o', '--'].concat(paths);
            repo._run(command, (err) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * get current head commit
     * @returns {Object}
     */
    async getHeadCommit () {
        const commit = await this.rawRepo.getHeadCommit();
        if (commit) {
            return {
                author: commit.author().toString().trim(),
                message: commit.message(),
                sha: commit.sha(),
                time: commit.timeMs()
            };
        }
    }

    /**
     * checkout branch
     * @param {String} branchName
     */
    async checkout (branchName) {
        // const branchRef = `refs/heads/${branchName}`;
        // const refNames = await this.rawRepo.getReferenceNames(nodegit.Reference.TYPE.LISTALL);

        // // create if branch not exists
        // if (refNames.indexOf(branchRef) < 0) {
        //     const remoteName = await this.getCurrentRemoteName();
        //     const remoteBranchName = `${remoteName}/${branchName}`;
        //     const refer = await this.rawRepo.getBranch(remoteBranchName);
        //     const newRefer = await this.rawRepo.createBranch(branchName, refer.target());
        //     await nodegit.Branch.setUpstream(newRefer, remoteBranchName);
        // }

        // await this.rawRepo.checkoutBranch(branchRef);

        const repo = simpleGit(this.dir);
        return await new Promise((resolve, reject) => {
            repo.checkout(branchName, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async hasBranchName (name) {
        const refNames = await this.rawRepo.getReferenceNames(nodegit.Reference.TYPE.LISTALL);
        const branchRef = `refs/heads/${name}`;
        return refNames.indexOf(branchRef) !== -1;
    }

    /**
     * get status of repo
     *
     * ```js
     * return [
     *   {
     *     path: 'path/to/file.js',
     *     status: [ 'WT_NEW', 'WT_MODIFIED', ... ]
     *   },
     *   ...
     * ]
     * ```
     *
     * @param {Boolean} untracted
     * @returns {Array}
     */
    async getStatus (untracted) {
        const options = {};
        if (untracted) {
            options.flags = Status.OPT.INCLUDE_UNTRACKED;
        }
        const list = [];
        await Status.foreach(this.rawRepo, async (filePath, sta) => {
            const name = path.basename(filePath);
            const map = {
                1: 'INDEX_NEW',
                2: 'INDEX_MODIFIED',
                4: 'INDEX_DELETED',
                8: 'INDEX_RENAMED',
                16: 'INDEX_TYPECHANGE',
                128: 'WT_NEW',
                256: 'WT_MODIFIED',
                512: 'WT_DELETED',
                16384: 'IGNORED',
                32768: 'CONFLICTED'
            };
            const status = map[sta];
            list.push({
                name,
                path: filePath,
                status
            });
        });

        const length = list.length;
        for (let i = length - 1; i >= 0; i--) {
            const isIgnored = await Ignore.pathIsIgnored(this.rawRepo, list[i].path);
            if (isIgnored) {
                list.splice(i, 1);
            }
        }

        return list;
    }

    /**
     * get current branch info
     * @returns {Object}
     */
    async getCurrentBranch () {
        const branch = await this.rawRepo.getCurrentBranch();
        if (branch) {
            return {
                ref: branch.name(),
                name: branch.shorthand(),
                head: !!branch.isHead(),
                target: branch.target().toString()
            };
        }
    }

    /**
     * get repo branches info
     *
     * ```js
     * return [
     *   {
     *     ref: 'refs/head/master',
     *     name: 'master',
     *     head: true,
     *     target: '...'
     *   },
     *   ...
     * ]
     * ```
     *
     * @returns {Array}
     */
    async getBranches () {
        const refs = await this.rawRepo.getReferences(Reference.TYPE.OID);
        const branches = [];
        const remotes = [];
        const tags = [];

        for (const ref of refs) {
            if (ref.isBranch()) {
                let remote, remoteOffset = 0;
                let localOffset = 0;
                let sameCommit = null;
                try {
                    remote = await Branch.upstream(ref);
                    let ret = await this.getCommitOffset(ref, remote);
                    localOffset = ret.localOffset;
                    remoteOffset = ret.remoteOffset;
                    sameCommit = ret.sameCommit;
                    ret = null;
                } catch (e) { e; console.log(e);
                }

                branches.push({
                    ref: ref.name(),
                    name: ref.shorthand(),
                    head: !!ref.isHead(),
                    localOffset,
                    remoteOffset,
                    isTracked: !!remote,
                    sameCommit,
                    remote: remote ? remote.shorthand().replace(`/${ref.shorthand()}`, '') : '',
                    target: ref.target().toString()
                });
            }
            if (ref.isRemote()) {
                const shorthand = ref.shorthand();
                let names = shorthand.split('/');
                const remote = names[0];
                names.splice(0, 1);
                names = names.join('/');
                remotes.push({
                    ref: ref.name(),
                    remote,
                    name: names,
                    head: !!ref.isHead(),
                    target: ref.target().toString()
                });
            }
            if (ref.isTag()) {
                const hash = await AnnotatedCommit.fromRevspec(this.rawRepo, ref.name());
                const commit = await this.rawRepo.getCommit(hash.id());
                tags.push({
                    ref: ref.name(),
                    name: ref.shorthand(),
                    id: commit.sha(),
                    target: ref.target().toString(),
                    date: commit.date(),
                    author: commit.author(),
                    committer: commit.committer(),
                    message: commit.summary()
                });
            }
        }

        const stashes = [];
        await nodegit.Stash.foreach(this.rawRepo, (index, message, oid) => {
            stashes.push({index, message, oid});
        });
        for (const i in stashes) {
            const stash = stashes[i];
            const commit = await this.rawRepo.getCommit(stash.oid);
            stash.ref = new Date(commit.date()).toLocaleString();
            stash.name = `${new Date(commit.date()).toLocaleString()}`;
            stash.date = commit.date();
            stash.author = commit.author();
            stash.committer = commit.committer();
        }
        
        return {
            branches,
            remotes,
            tags,
            stashes
        };
    }

    /**
     * features 分支
     */
    async getFeatures () {
        const refs = await this.rawRepo.getReferences(Reference.TYPE.OID);
        const isInitialized = await Flow.isInitialized(this.rawRepo);
        const features = {};
        if (!isInitialized) {
            return features;
        }
        const config = await Flow.getConfig(this.rawRepo);
        const featurePrefix = config['gitflow.prefix.feature'];
        for (const ref of refs) {
            if (ref.isBranch()) {
                const name = ref.shorthand();
                if (name.indexOf(featurePrefix) === 0) {
                    features[name.replace(featurePrefix, '')] = true;
                }
            }
        }
        return features;
    }

    /**
     * 创建一个新的feature分支
     * @param {*} name 
     */
    async startFeature (name) {
        const headCommit = await this.rawRepo.getHeadCommit();
        await Flow.startFeature(this.rawRepo, name, {
            sha: headCommit.sha()
        });
    }

    async getCommitHistory () {
        const ref = await this.rawRepo.getCurrentBranch();
        let upstream;
        try {
            upstream = await Branch.upstream(ref);
        } catch (e) {
            console.log('has no tracked remote');
        }
        
        let rets;
        let upCommits;
        let localTime;
        let remoteTime;
        if (upstream) {
            const headCommit = await this.getBranchHeadCommit(ref);
            const upHeadCommit = await this.getBranchHeadCommit(upstream);
            if (headCommit && !upHeadCommit) {
                localTime = headCommit.time();
                const commits = await this.getBranchCommitHistory(ref);
                rets = commits;
                rets = rets.map(item => {
                    const obj = this.getCommitSerilize(item);
                    obj.isLocal = true;
                    return obj;
                });
            } else if (!headCommit && upHeadCommit) {
                remoteTime = upHeadCommit.time();
                upCommits = await this.getBranchCommitHistory(upstream);
                rets = upCommits;
                rets = rets.map(item => {
                    const obj = this.getCommitSerilize(item);
                    obj.isRemote = true;
                    return obj;
                });
            } else {
                const key = `${this.dir}:${ref.name()}:${upstream.name()}`;
                let storeCommit = null;
                store.remove(key);
                if (store.get(key)) {
                    storeCommit = JSON.parse(store.get(key));
                }
                const aheadbehind = await this.getAheadBehind(ref);
                const start = new Date().getTime();
                let unpushs = [];
                let upCommits = [];
                let startSha = null;
                if (aheadbehind.ahead) {
                    unpushs = await this.getBranchCommitHistory(ref, aheadbehind.ahead + 1);
                    startSha = unpushs.pop().sha();
                    unpushs = unpushs.map(item => {
                        const obj = this.getCommitSerilize(item);
                        obj.isLocal = true;
                        return obj;
                    });
                } else {
                    const commit = await this.getBranchHeadCommit(ref);
                    startSha = commit.sha();
                }

                if (aheadbehind.behind) {
                    upCommits = await this.getBranchCommitHistory(upstream, aheadbehind.behind);
                    upCommits = upCommits.map(item => {
                        const obj = this.getCommitSerilize(item);
                        obj.isRemote = true;
                        return obj;
                    });
                }
                let stageCommits;
                if (storeCommit) {
                    if (storeCommit[0].sha1 === startSha) {
                        console.log('和缓存一致不需要重新获取');
                        stageCommits = storeCommit;
                    } else {
                        console.log('和缓存不一致，需要重新获取');
                        const data = {
                            commits: []
                        };
                        await this.getBranchCommitHistoryUtilSha(startSha, storeCommit[0].sha1, data);
                        let lostCommits = data.commits;
                        lostCommits = lostCommits.map(item => {
                            return this.getCommitSerilize(item);
                        });
                        const same = lostCommits[0];
                        same.isLocal = true;
                        same.isSameNode = true;
                        storeCommit.shift();
                        stageCommits = lostCommits.concat(storeCommit);
                        store.set(key, JSON.stringify(stageCommits));
                    }
                } else {
                    console.log('没有缓存重新获取');
                    
                    const data = {
                        commits: []
                    };
                    await this.getCommitPage(startSha, data);
                    stageCommits = data.commits;
                    // 不应该没有数据  说明是一个初始化的repo
                    if (!stageCommits.length) {
                        stageCommits = [headCommit];
                    }

                    stageCommits = stageCommits.map(item => {
                        return this.getCommitSerilize(item);
                    });
                    
                    const same = stageCommits[0];
                    if (same) {
                        same.isLocal = true;
                        same.isSameNode = true;
                    }

                    store.set(key, JSON.stringify(stageCommits));
                }
                
                rets = unpushs.concat(upCommits);

                rets.sort((a, b) => {
                    if (a.time < b.time) {
                        return 1;
                    }
                    if (a.time > b.time) {
                        return -1;
                    }
                    return 0;
                });

                rets = rets.concat(stageCommits);
                console.log(new Date().getTime() - start);
            }
        } else {
            rets = await this.getBranchCommitHistory(ref);
            const headCommit = await this.getBranchHeadCommit(ref);
            if (headCommit) {
                rets = rets.map(item => {
                    const obj = this.getCommitSerilize(item);
                    obj.isLocal = true;
                    return obj;
                });
            }
        }
        
        return {
            commits: rets,
            localTime,
            remoteTime
        };
    }

    getCommitSerilize (item) {
        return {
            sha1: item.sha(),
            parents: item.parents().map(p => {
                return p.tostrS();
            }),
            parentcount: item.parentcount(),
            author: {
                name: item.author().name(),
                email: item.author().email()
            },
            committer: {
                name: item.committer().name(),
                email: item.committer().email()
            },
            date: item.date(),
            id: item.id(),
            message: item.message(),
            summary: item.summary(),
            time: item.time()
        };
    }

    async getBranchCommitHistoryUtilSha (startSha, endSha, data) {
        const walker = this.rawRepo.createRevWalk();
        walker.push(startSha);
        walker.sorting(Revwalk.SORT.Time);
        const commits = await walker.getCommits(2);
        const next = commits.pop();
        const nextSha = next.sha();
        if (nextSha !== endSha) {
            data.commits = data.commits.concat(commits);
            await this.getBranchCommitHistoryUtilSha(nextSha, endSha, data);
        } else {
            data.commits = data.commits.concat(commits).concat(next);
        }
    }

    async getAheadBehind (ref) {
        const aheadbehind = await new Promise((resolve, reject) => {
            ipcRenderer.send('getAheadBehind', this.dir, ref.name());
            ipcRenderer.once('getAheadBehind_res', (event, err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return aheadbehind;
    }

    async getFileCommitHistory (historyFile) {
        const headCommit = await this.rawRepo.getMasterCommit();
        const walker = this.rawRepo.createRevWalk();
        walker.push(headCommit.sha());
        walker.sorting(nodegit.Revwalk.SORT.Time);

        const history = await walker.fileHistoryWalk(historyFile, 500);
        const commits = history.map(item => {
            return item.commit;
        });
        for (let i = commits.length - 1; i > 0; i--) {
            const parent = commits[i].sha();
            commits[i - 1].parents = [parent];
        }
        
        return {
            commits,
            localTime: headCommit.time(),
            remoteTime: 9999999999999
        };
    }

    /**
     * 获取分支的提交历史
     * @param {*} ref 
     */
    async getBranchCommitHistory (ref, num) {
        const commit = await this.getBranchHeadCommit(ref);
        if (commit) {
            if (num) {
                const walker = this.rawRepo.createRevWalk();
                walker.push(commit.sha());
                walker.sorting(Revwalk.SORT.Time);
                const commits = await walker.getCommits(num);
                return commits;
            }
            const data = {
                commits: []
            };
            await this.getCommitPage(commit.sha(), data);
            
            return data.commits;
        }
        return null;
    }

    async getBranchCommitHistoryBySha (sha) {
        const walker = this.rawRepo.createRevWalk();
        walker.push(sha);
        walker.sorting(Revwalk.SORT.Time);
        const commits = await walker.getCommits(50);
        return commits;
    }

    async getCommitPage (sha, data) {
        const walker = this.rawRepo.createRevWalk();
        walker.push(sha);
        walker.sorting(Revwalk.SORT.Time);
        const history = await walker.getCommits(50);
        const startSha = history.pop().sha();

        if (startSha !== sha) {
            data.commits = data.commits.concat(history);
            await this.getCommitPage (startSha, data);
        }
    }

    /**
     * 分支最新的提交
     * @param {*} ref 
     */
    async getBranchHeadCommit (ref) {
        const commit = await this.rawRepo.getReferenceCommit(ref.name());
        return commit;
    }

    async getCommitOffset (ref, remote) {
        // const commit = await this.rawRepo.getCommit(ref.target());
        // const remoteCommit = await this.rawRepo.getReferenceCommit(remote);
        let localOffset, remoteOffset;
        // if (commit && remoteCommit) {
        //     if (commit.time() === remoteCommit.time()) {
        //         remoteOffset = 0;
        //     } else {
        //         const commits = await this.getCommitsUntil(remoteCommit.sha(), remoteCommit.time(), commit.time());
        //         const offset = commits.length;
        //         remoteOffset = offset;
        //     }
        // } else {
        //     return remoteOffset = null;
        // }
        let localCommits = await this.getBranchCommitHistory(ref);
        let remoteCommits = await this.getBranchCommitHistory(remote);

        let sameCommit = this.getSameCommit(localCommits, remoteCommits);
        while (!sameCommit) {
            const localCommit = localCommits[localCommits.length - 1];
            const remoteCommit = remoteCommits[remoteCommits.length - 1];
            const commits1 = this.getBranchCommitHistoryBySha(localCommit.sha());
            const commits2 = this.getBranchCommitHistoryBySha(remoteCommit.sha());

            sameCommit = this.getSameCommit(commits1, commits2);
            localCommits = localCommits.concat(commits1);
            remoteCommits = localCommits.concat(commits2);
        }

        for (const i in localCommits) {
            const commit = localCommits[i];
            if (commit.sha() === sameCommit.sha()) {
                localOffset = parseInt(i, 10);
            }
        }

        for (const i in remoteCommits) {
            const commit = remoteCommits[i];
            if (commit.sha() === sameCommit.sha()) {
                remoteOffset = parseInt(i, 10);
            }
        }

        return {localOffset, remoteOffset, sameCommit: sameCommit.sha(), localCommits, remoteCommits};
    }

    getSameCommit (localCommits, remoteCommits) {
        const map = {};
        localCommits.forEach(item => {
            map[item.time()] = item;
        });
        
        for (const i in remoteCommits) {
            if (map[remoteCommits[i].time()]) {
                return map[remoteCommits[i].time()];
            }
        }
        return null;
    }

    /**
     * 获取commit
     * @param {*} oid 
     */
    async getCommitInfo (oid) {
        const commit = await this.rawRepo.getCommit(oid);
        const diffs = await commit.getDiff();
        let patches = [];
        for (const i in diffs) {
            const diff = diffs[i];
            const ps = await diff.patches();
            patches = patches.concat(ps);
        }
        
        return {
            commit,
            patches
        };
    }

    async ignoreRule (rule) {
        return await Ignore.addRule(this.rawRepo, rule);
    }

    async checkOutFile (filePath) {
        const opts = {
            checkoutStrategy: Checkout.STRATEGY.FORCE,
            paths: filePath
        };
        await Checkout.head(this.rawRepo, opts);
    }

    /**
     * 将修改的文件放入贮藏区
     * @param {*} message 
     * @param {*} options 
     */
    async stash (message, options) {
        options = options || {};

        let name = options.name || '';
        let email = options.email || '';

        if (!name || !email) {
            const config = gitConfig(this.dir);
            if (config.user) {
                name = name || config.user.name;
                email = email || config.user.email;
            }
        }

        const author = nodegit.Signature.now(name, email);
        return await Stash.save(this.rawRepo, author, message, 0);
    }

    async stashPop (index) {
        return await Stash.pop(this.rawRepo, index);
    }

    async stashDrop (index) {
        return await Stash.drop(this.rawRepo, index);
    }

    async stashApply (index) {
        return await Stash.apply(this.rawRepo, index);
    }

    async getIndexFiles () {
        const index = await this.rawRepo.refreshIndex();
        const entries = index.entries();
        const paths = entries.map(item => {
            return item.path;
        });
        return paths;
    }

    /**
     * 获取Diff内容
     * @param {*} filePath 
     */
    async getDiffText (filePath) {
        const staNumber = await Status.file(this.rawRepo, filePath);
        const map = {
            1: 'INDEX_NEW',
            2: 'INDEX_MODIFIED',
            4: 'INDEX_DELETED',
            8: 'INDEX_RENAMED',
            16: 'INDEX_TYPECHANGE',
            128: 'WT_NEW',
            256: 'WT_MODIFIED',
            512: 'WT_DELETED',
            16384: 'IGNORED',
            32768: 'CONFLICTED'
        };
        const status = map[staNumber];
        const index = await this.rawRepo.refreshIndex();
        let diff;
        if (status.indexOf('INDEX') !== -1) {
            const commit = await this.rawRepo.getHeadCommit();
            const tree = await commit.getTree();
            diff = await nodegit.Diff.treeToIndex(this.rawRepo, tree, index, {
                flags:
                    nodegit.Diff.OPTION.SHOW_UNTRACKED_CONTENT
                    | nodegit.Diff.OPTION.RECURSE_UNTRACKED_DIRS,
                pathspec: filePath
            });
        } else {
            diff = await nodegit.Diff.indexToWorkdir(this.rawRepo, index, {
                flags:
                    nodegit.Diff.OPTION.SHOW_UNTRACKED_CONTENT
                    | nodegit.Diff.OPTION.RECURSE_UNTRACKED_DIRS,
                pathspec: filePath
            });
        }
        let buf = await diff.toBuf(nodegit.Diff.FORMAT.PATCH);
        buf = buf.replace(/%/g, '%25');
        buf = decodeURI(buf.replace(/\\\d{3}/g, (a) => {
            const num = a.substr(1);
            let code = Number(parseInt(num, 8)).toString(16);
            code = `%${(`${code}`).toUpperCase()}`;
            return code;
        }));
        return buf;
        // }
        // }
    }

    /**
     * 修改commit的message
     * @param {*} message 
     * @param {*} oid 
     */
    async editMessage (message, oid) {
        const commit = await this.rawRepo.getCommit(oid);
        const author = commit.author();
        const committer = commit.committer();
        const authora = nodegit.Signature.now(author.name(), author.email());
        const committera = nodegit.Signature.now(committer.name(), committer.email());
        await commit.amend('HEAD', authora, committera, 'UTF-8', message, null, null);
    }

    async deleteBranch (name) {
        const ref = await this.rawRepo.getBranch(`refs/heads/${name}`);
        await Branch.delete(ref);
    }

    async addTag (params) {
        await this.rawRepo.createTag(params.commitId, params.name, params.message);
    }

    async deleteTag (name) {
        await this.rawRepo.deleteTagByName(name);
    }

    async deleteRemote (refName) {
        const ref = await this.rawRepo.getBranch(refName);
        await Branch.delete(ref);
    }

    async getRemoteName (ref) {
        const branch = await this.rawRepo.getBranch(ref);
        try {
            const remoteRef = await Branch.upstream(branch);
            return remoteRef.shorthand();
        } catch (e) {
            return null;
        }
    }

    /**
     * 执行review
     * @param {*} branchName 
     */
    async review (branchName) {
        const repo = simpleGit(this.dir);
        return await new Promise((resolve, reject) => {
            console.log(branchName);
            repo._run(['review', branchName], (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async setRemoteURL (remoteName, url) {
        await Remote.setUrl(this.rawRepo, remoteName, url);
    }

    /**
     * 获取文件内容
     * @param {*} sha1 
     * @param {*} filePath 
     */
    async getFileBlob (sha1, filePath) {
        const commit = await this.getCommitInfo(sha1);
        const tree = await commit.commit.getTree();
        const entry = await tree.getEntry(filePath);
        const filemode = entry.filemode();
        
        // filemode == 0 为不可读
        if (entry.isFile() && filemode !== 0) {
            const blob = await entry.getBlob();
            const content = blob.content();
            return {
                name: entry.name(),
                content
            };
        }
        return null;
    }

    istextfile ( filepath, length ) {
        const fd = fs.openSync( filepath, 'r' );
        length = length || 1000;
        for ( let i = 0;i < length;i++ ) {
            const buf = new Buffer( 1 );
            const bytes = fs.readSync( fd, buf, 0, 1, i );
            const char = buf.toString().charCodeAt();
            if ( bytes === 0) {
                fd && fs.close(fd);
                return true;
            } else if (bytes === 1 && char === 0) {
                fd && fs.close(fd);
                return false;
            }
        }
        return true;
    }
}

Repo._lastRepoId = 1;
Repo._openRepos = [];

export default Repo;
