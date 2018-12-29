const electron = require('electron');
const Git = require('nodegit');
const { ipcMain } = electron;
const path = require('path');
const os = require('os');
const {
    Repository,
    Branch,
    Cred
} = Git;


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

async function push (dir) {
    const cred = fetchOptions();
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
