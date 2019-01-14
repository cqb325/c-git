const electron = require('electron');
const Git = require('nodegit');
const Configstore = require('configstore');
const { ipcMain } = electron;
const path = require('path');
const os = require('os');
const {
    Repository,
    Branch,
    Cred,
    Clone,
    Reference,
    Graph,
    AnnotatedCommit,
    Stash
} = Git;
const store = new Configstore('c-git');

async function open (dir) {
    const repo = await Repository.open(dir);
    return repo;
}

const DEFAULT_CREDENTIALS = {
    type: 'ssh',
    privateKey: path.join(os.homedir(), '.ssh', 'id_rsa'),
    publicKey: path.join(os.homedir(), '.ssh', 'id_rsa.pub'),
    passphrase: '',
    username: '',
    password: ''
};


function fetchOptions (credentials) {
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

function getItemByPath (dir) {
    for (const name in store.all) {
        const item = store.all[name];
        if (item.dir === dir) {
            return item;
        }
    }
    return null;
}

async function push (dir) {
    let cred;
    let repo = await open(dir);
  
    const branch = await repo.getCurrentBranch();
    if (!branch.isHead()) {
        throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`);
    }
  
    const upstream = await Branch.upstream(branch);
    const remoteName = await Branch.remoteName(repo, upstream.name());
    const remote = await repo.getRemote(remoteName);
    const remoteBranchName = upstream.shorthand().replace(`${remoteName}/`, '');
    const refspec = `refs/heads/${branch.shorthand()}:refs/heads/${remoteBranchName}`;
    const url = remote.url();
    if (url.indexOf('ssh') !== -1) {
        cred = fetchOptions({type: 'ssh'});
    }
    if (url.indexOf('http') !== -1) {
        const storeInfo = getItemByPath(dir);
        const auth = storeInfo.auth;
        cred = fetchOptions({
            type: 'http',
            username: auth.username,
            password: auth.password
        });
    }
  
    await remote.push([refspec], cred);
    repo.free();
    repo = null;
}

async function fetchAll (dir) {
    const repo = await open(dir);
    await repo.fetchAll(fetchOptions());
}

async function addBranch (params) {
    const repo = await open(params.dir);
    const commit = await repo.getHeadCommit();
    if (params.remote) {
        const ref = await repo.createBranch(params.name, commit, true);
        await Branch.setUpstream(ref, params.remote);
    } else {
        // let remoteName = getCurrentRemoteName(repo);
        await repo.createBranch(params.name, commit, true);
    }
}

/**
 * 设置upstram
 * @param {*} params 
 */
async function setUpstream (params) {
    let repo = await open(params.dir);
    const branch = await repo.getBranch(params.branchName);
    await Branch.setUpstream(branch, params.upstreamName);
    repo.free();
    repo = null;
}

/**
 * 克隆
 * @param {*} params 
 */
async function clone (params) {
    await Clone(params.url, params.dir, {
        checkoutBranch: 'master',
        fetchOpts: fetchOptions()
    });
}

async function getBranches (dir) {
    let repo = await open(dir);
    const refs = await repo.getReferences(Reference.TYPE.OID);
    const branches = [];
    const remotes = [];
    const tags = [];

    for (const ref of refs) {
        if (ref.isBranch()) {
            let remote, remoteOffset = 0;
            let localOffset = 0;
            const localCommit = await getBranchHeadCommit(repo, ref);
            try {
                remote = await Branch.upstream(ref);
                const remoteCommit = await getBranchHeadCommit(repo, remote);
                const aheadBehind = await Graph.aheadBehind(repo, localCommit.sha(), remoteCommit.sha());
                localOffset = aheadBehind.ahead;
                remoteOffset = aheadBehind.behind;
            } catch (e) { e; }

            branches.push({
                ref: ref.name(),
                name: ref.shorthand(),
                head: !!ref.isHead(),
                localOffset,
                remoteOffset,
                remote: remote ? remote.shorthand().replace(`/${ref.shorthand()}`, '') : '',
                target: ref.target().toString()
            });
            branches.sort((a, b) => {
                return a.name <= b.name;
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
            remotes.sort((a, b) => {
                return a.name <= b.name;
            });
        }
        if (ref.isTag()) {
            const hash = await AnnotatedCommit.fromRevspec(repo, ref.name());
            const commit = await repo.getCommit(hash.id());
            tags.push({
                ref: ref.name(),
                name: ref.shorthand(),
                id: commit.sha(),
                target: ref.target().toString(),
                date: commit.date(),
                author: {
                    name: commit.author().name(),
                    email: commit.author().email()
                },
                committer: commit.committer(),
                message: commit.summary()
            });
            tags.sort((a, b) => {
                return a.name <= b.name;
            });
        }
    }

    const stashes = [];
    await Stash.foreach(repo, (index, message, oid) => {
        stashes.push({index, message, oid});
    });
    for (const i in stashes) {
        const stash = stashes[i];
        const commit = await repo.getCommit(stash.oid);
        stash.ref = new Date(commit.date()).toLocaleString();
        stash.name = `${new Date(commit.date()).toLocaleString()}`;
        stash.date = commit.date();
        stash.author = {
            name: commit.author().name(),
            email: commit.author().email()
        };
        stash.committer = commit.committer();
    }
    stashes.sort((a, b) => {
        return a.name <= b.name;
    });

    repo.free();
    repo = null;
    
    return {
        branches,
        remotes,
        tags,
        stashes
    };
}

async function getBranchHeadCommit (repo, ref) {
    const commit = await repo.getReferenceCommit(ref.name());
    return commit;
}

/**
 * ahead behind
 * @param {*} dir 
 * @param {*} refName 
 */
async function getAheadBehind (dir, refName) {
    let repo = await open(dir);
    const ref = await repo.getReference(refName);

    const localCommit = await getBranchHeadCommit(repo, ref);
    try {
        const remote = await Branch.upstream(ref);
        const remoteCommit = await getBranchHeadCommit(repo, remote);
        const aheadBehind = await Graph.aheadBehind(repo, localCommit.sha(), remoteCommit.sha());
        return aheadBehind;
    } catch (e) {
        e;
    }
    const aheadBehind = {
        ahead: 0,
        behind: 0
    };
    repo.free();
    repo = null;
    return aheadBehind;
}

/**
 * push commits
 */
ipcMain.on('push', async (event, dir) => {
    console.log('push....');
    try {
        await push(dir);
        event.sender.send('push_res', null);
    } catch (e) {
        event.sender.send('push_res', e.message);
    }
});

ipcMain.on('fetchAll', async (event, dir) => {
    console.log('fetchAll....');
    try {
        await fetchAll(dir);
        event.sender.send('fetchAll_res', null);
    } catch (e) {
        event.sender.send('fetchAll_res', e.message);
    }
});

ipcMain.on('addBranch', async (event, params) => {
    console.log('addBranch....');
    try {
        await addBranch(params);
        event.sender.send('addBranch_res', null);
    } catch (e) {
        event.sender.send('addBranch_res', e.message);
    }
});

ipcMain.on('setUpstream', async (event, params) => {
    console.log('setUpstream....');
    try {
        await setUpstream(params);
        event.sender.send('setUpstream_res', null);
    } catch (e) {
        event.sender.send('setUpstream_res', e.message);
    }
});

ipcMain.on('clone', async (event, params) => {
    console.log('clone....');
    try {
        await clone(params);
        event.sender.send('clone_res', null);
    } catch (e) {
        event.sender.send('clone_res', e.message);
    }
});

ipcMain.on('getBranches', async (event, dir) => {
    console.log('getBranches....');
    try {
        const data = await getBranches(dir);
        event.sender.send('getBranches_res', null, data);
    } catch (e) {
        event.sender.send('getBranches_res', e.message, null);
    }
});

ipcMain.on('getAheadBehind', async (event, dir, refName) => {
    console.log('getAheadBehind....');
    try {
        const data = await getAheadBehind(dir, refName);
        event.sender.send('getAheadBehind_res', null, data);
    } catch (e) {
        event.sender.send('getAheadBehind_res', e.message, null);
    }
});
