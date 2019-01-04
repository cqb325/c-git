import React from 'react';
import Layout from 'r-cmui/components/Layout';
import ResizeContent from 'r-cmui/components/Layout/ResizeContent';
import Notification from 'r-cmui/components/Notification';
import Dialog from 'r-cmui/components/Dialog';
import FileTree from './FileTree';
import Branches from './Branches';
import Status from './Status';
import History from './History';
import CommitInfo from './CommitInfo';
import DiffContent from './DiffContent';
import Welcome from './welcome';
import CreateContent from './welcome/create';
import CloneContent from './welcome/clone';
import AboutContent from './welcome/about';
import utils from '../utils/utils';
const {remote, ipcRenderer} = require('electron');
const Configstore = require('configstore');
const {Content} = Layout;
const {dialog} = remote;
ipcRenderer.send('connection');
const store = new Configstore('c-git');
import GitClient from '../utils/git';
import './style.less';

import { inject, observer } from 'mobx-react';

@inject('repo')
@inject('status')
@observer
class Desktop extends React.Component {
    displayName = 'Desktop';

    branchesTimer = null;
    historyTimer = null;
    treeTimer = null;
    statusTimer = null;
    store = null;

    componentWillUnmount () {
        this.props.repo.closeWatch();
    }

    onSelectRepo = (dir) => {
        try {
            this.props.repo.setCurrentRepo(dir, (event, path) => {
                if (path.indexOf('.git\\') !== -1) {
                    console.log(event, path);
                    // stash change
                    if (path.indexOf('.git\\refs\\stash') !== -1 || path.indexOf('.git\\HEAD')) {
                        this.refreshBranches();
                    }
                    if (path.indexOf('.git\\logs\\HEAD') !== -1 || path.indexOf('.git\\HEAD') !== -1 || path.indexOf('.git\\FETCH_HEAD') !== -1) {
                        this.refreshHistory(() => {
                            this.refreshStatus();
                        });
                    }
                    if (event === 'unlink' && path.indexOf('.git\\index.lock') !== -1) {
                        this.refreshStatus();
                    }
                } else {
                    // 创建删除目录
                    if (event === 'unlinkDir' || event === 'addDir' || path.indexOf('.gitignore') !== -1) {
                        this.refreshFileTree();
                    }
                    this.refreshStatus();
                }
            });
        } catch (e) {
            Notification.error({
                title: 'error',
                desc: e.message,
                theme: 'danger'
            });
        }
    }

    refreshHistory (callback) {
        if (this.historyTimer) {
            clearTimeout(this.historyTimer);
            this.historyTimer = null;
        }
        this.historyTimer = setTimeout(() => {
            this.historyTimer = null;
            this.history.refresh();
            if (callback) {
                callback();
            }
        }, 1000);
    }

    refreshBranches () {
        if (this.branchesTimer) {
            clearTimeout(this.branchesTimer);
            this.branchesTimer = null;
        }
        this.branchesTimer = setTimeout(() => {
            this.branchesTimer = null;
            this.branches.refresh();
        }, 300);
    }

    refreshFileTree () {
        if (this.treeTimer) {
            clearTimeout(this.treeTimer);
            this.treeTimer = null;
        }
        this.treeTimer = setTimeout(() => {
            this.treeTimer = null;
            this.fileTree.refresh();
        }, 1000);
    }

    refreshStatus () {
        if (this.statusTimer) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }
        this.statusTimer = setTimeout(() => {
            this.statusTimer = null;
            this.status.refresh();
        }, 300);
    }

    componentDidMount () {
        ipcRenderer.on('menu_welcome', () => {
            this.openWelcome();
        });
        ipcRenderer.on('open_repo', (event, item) => {
            this.onSelectRepoItem(item);
        });
        ipcRenderer.on('menu_open', () => {
            this.openRepo();
        });
        ipcRenderer.on('menu_create', () => {
            this.openCreateDialog();
        });
        ipcRenderer.on('menu_about', () => {
            this.openAboutDialog();
        });
        ipcRenderer.on('menu_clone', () => {
            this.openCloneDialog();
        });
        const dir = sessionStorage.getItem('current_repo_cwd');
        if (dir) {
            this.onSelectRepo(dir);
        }
    }

    openRepo = () => {
        dialog.showOpenDialog({
            title: '选择仓库目录',
            properties: ['openDirectory']
        }, (filePaths) => {
            if (filePaths) {
                const ret = utils.isGitDir(filePaths[0]);
                if (ret === 'OK') {
                    const info = utils.getRepoInfo(filePaths[0]);
                    let storeItem = this.getItemByPath(filePaths[0]);
                    if (!storeItem) {
                        storeItem = {
                            name: info.name,
                            dir: filePaths[0],
                            lastOpenTime: new Date().getTime(),
                            auth: info.user || {}
                        };
                    } else {
                        storeItem.lastOpenTime = new Date().getTime();
                    }
                    store.set(storeItem.name, storeItem);

                    sessionStorage.setItem('current_repo_cwd', filePaths[0]);
                    this.onSelectRepo(filePaths[0]);
                } else {
                    let desc = '';
                    if (ret === 'NOACCESS') {
                        desc = '该目录不存在请重新选择';
                    }
                    if (ret === 'NOGIT') {
                        desc = '该目录不存在Git仓库，请重新选择';
                    }
                    Notification.error({
                        title: 'error',
                        desc,
                        theme: 'danger'
                    });
                }
            }
        });
    }

    getItemByPath (dir) {
        for (const name in store.all) {
            const item = store.all[name];
            if (item.dir === dir) {
                return item;
            }
        }
        return null;
    }

    onSelectRepoItem (item) {
        item.lastOpenTime = new Date().getTime();
        store.set(item.name, item);

        sessionStorage.setItem('current_repo_cwd', item.dir);
        this.onSelectRepo(item.dir);
    }

    openWelcome () {
        this.props.repo.closeWatch();
        sessionStorage.setItem('current_repo_cwd', '');
        this.props.repo.setCwd('');
    }

    bindStatus (ref) {
        this.status = ref;
    }

    bindBranches (ref) {
        this.branches = ref;
    }

    bindFileTree (ref) {
        this.fileTree = ref;
    }

    bindHistory (ref) {
        this.history = ref;
    }

    onCommit = () => {
        this.history.refresh();
    }

    openCreateDialog = () => {
        this.createDialog.open();
    }

    onCreateRepo = (flag) => {
        if (flag) {
            if (this.createContent.isValid()) {
                this.createDialog.showLoading();
                const params = this.createContent.getValue();
                this.createRepo(params);
            }
            return false;
        }
        return true;
    }

    createRepo = async (params) => {
        if (params.dir) {
            const dir = params.dir;
            const ret = utils.isGitDir(params.dir);
            if (ret === 'OK') {
                Notification.info({
                    title: 'Tip',
                    desc: `${dir} already has a repository change an other directory`,
                    theme: 'danger'
                });
                this.createDialog.hideLoading();
                this.createDialog.close();
                return;
            }
            const client = new GitClient(dir);
            try {
                const files = [];
                if (params.ingoreTemplate) {
                    files.push('.gitignore');
                    utils.createIngoreFile(params.ingoreTemplate, dir);
                }
                await client.init();
                await this.props.status.initClient(dir);
                await this.props.status.commit(files, 'init commit');
                
                const info = utils.getRepoInfo(dir);
                store.set(info.name, {
                    name: info.name,
                    dir,
                    lastOpenTime: new Date().getTime(),
                    auth: info.user || {}
                });
                sessionStorage.setItem('current_repo_cwd', dir);
                this.onSelectRepo(dir);
            } catch (e) {
                Notification.error({
                    title: 'error',
                    desc: e.message,
                    theme: 'danger'
                });
            } finally {
                if (this.createDialog) {
                    this.createDialog.hideLoading();
                    this.createDialog.close();
                }
            }
        }
    }

    openCloneDialog = () => {
        this.cloneDialog.open();
    }

    onCloneRepo = (flag) => {
        if (flag) {
            if (this.cloneContent.isValid()) {
                this.cloneDialog.showLoading();
                const params = this.cloneContent.getValue();
                this.cloneRepo(params);
            }
            return false;
        }
        return true;
    }

    cloneRepo = async (params) => {
        const ret = utils.isGitDir(params.dir);
        if (ret === 'OK') {
            Notification.info({
                title: 'Clone Repository',
                desc: `${params.dir} already has a repository change an other directory`,
                theme: 'danger'
            });
            this.createDialog.hideLoading();
            this.createDialog.close();
            return;
        }
        try {
            ipcRenderer.send('clone', params);
            ipcRenderer.once('clone_res', (event, err) => {
                if (err) {
                    Notification.error({
                        title: 'Clone Repository',
                        desc: err,
                        theme: 'danger'
                    });
                } else {
                    const info = utils.getRepoInfo(params.dir);
                    const storeItem = this.getItemByPath(params.dir);
                    if (storeItem) {
                        store.delete(storeItem.name);
                    }
                    store.set(info.name, {
                        name: info.name,
                        dir: params.dir,
                        lastOpenTime: new Date().getTime(),
                        auth: info.user || {}
                    });
                    sessionStorage.setItem('current_repo_cwd', params.dir);
                    this.onSelectRepo(params.dir);
                }
            });
        } catch (e) {
            Notification.error({
                title: 'Clone Repository',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            if (this.cloneDialog) {
                this.cloneDialog.hideLoading();
                this.cloneDialog.close();
            }
        }
    }

    openAboutDialog = () => {
        this.aboutDialog.open();
    }

    render () {
        console.log('render index...');
        const {cwd, historyFile} = this.props.repo;
        if (!cwd) {
            return <Layout>
                <Welcome onSelectRepo={this.onSelectRepo} parent={this}/>
                <Dialog ref={f => this.createDialog = f} title='Create Repository' 
                    content={<CreateContent ref={f => this.createContent = f}/>} onConfirm={this.onCreateRepo}/>

                <Dialog ref={f => this.cloneDialog = f} title='Clone Repository' 
                    content={<CloneContent ref={f => this.cloneContent = f}/>} onConfirm={this.onCloneRepo}/>

                <Dialog ref={f => this.aboutDialog = f} title='About C-Git' useDefaultFooters={false}
                    content={<AboutContent />}/>
            </Layout>;
        }

        return <Layout style={{flexDirection: 'row'}}>
            <DiffContent />
            <ResizeContent handlerSize={3} minWidth={150} direction='vertical' align='right' className='left-sider'>
                <Layout>
                    <ResizeContent handlerSize={3} height={'50%'} align='bottom'>
                        <FileTree cwd={cwd} bind={this.bindFileTree.bind(this)}/>
                    </ResizeContent>
                    <ResizeContent style={{flex: 1}} resizeable={false}>
                        <Branches bind={this.bindBranches.bind(this)}/>
                    </ResizeContent>
                </Layout>
            </ResizeContent>
            <Content>
                <Layout style={{flexDirection: 'row', flex: 1}}>
                    <ResizeContent style={{flex: 1}} direction='vertical' resizeable={false}>
                        <History bind={this.bindHistory.bind(this)} historyFile={historyFile} parent={this}/>
                    </ResizeContent>
                    <ResizeContent handlerSize={3} width={300} minWidth={300} direction='vertical' align='left' className='right-sider'>
                        <Status bind={this.bindStatus.bind(this)} onCommit={this.onCommit}/>
                        <CommitInfo/>
                    </ResizeContent>
                </Layout>
            </Content>

            <Dialog ref={f => this.createDialog = f} title='Create Repository' 
                content={<CreateContent ref={f => this.createContent = f}/>} onConfirm={this.onCreateRepo}/>

            <Dialog ref={f => this.cloneDialog = f} title='Clone Repository' 
                content={<CloneContent ref={f => this.cloneContent = f}/>} onConfirm={this.onCloneRepo}/>

            <Dialog ref={f => this.aboutDialog = f} title='About C-Git' useDefaultFooters={false}
                content={<AboutContent />}/>
        </Layout>;
    }
}

export default Desktop;
