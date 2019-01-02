import React from 'react';
import Layout from 'r-cmui/components/Layout';
import Sider from 'r-cmui/components/Layout/Sider';
import List from 'r-cmui/components/List';
import Row from 'r-cmui/components/Row';
import Col from 'r-cmui/components/Col';
import Button from 'r-cmui/components/Button';
import Notification from 'r-cmui/components/Notification';
import MessageBox from 'r-cmui/components/MessageBox';
import Dialog from 'r-cmui/components/Dialog';
import CreateContent from './create';
import CloneContent from './clone';
const Configstore = require('configstore');
const path = require('path');

import git from '../../images/git.svg';
import logo from '../../images/logo.png';
import open from '../../images/open.svg';
import clone from '../../images/clone.svg';
import create from '../../images/icon-createfolder.svg';
import utils from '../../utils/utils';
import GitClient from '../../utils/git';
const {remote, ipcRenderer} = require('electron');
const { dialog } = remote;
const {Content} = Layout;

import './style.less';
import { inject, observer } from 'mobx-react';

@inject('status')
@observer
class Welcome extends React.Component {
    displayName = 'Welcome';

    store = null;

    state = {
        render: 0
    }

    openRepo = () => {
        dialog.showOpenDialog({
            title: '选择仓库目录',
            properties: ['openDirectory']
        }, (filePaths) => {
            if (filePaths) {
                const ret = utils.isGitDir(filePaths[0]);
                if (ret === 'OK') {
                    if (!this.store) {
                        this.store = new Configstore('c-git');
                    }
                    const info = utils.getRepoInfo(filePaths[0]);
                    this.store.set(info.name, {
                        name: info.name,
                        dir: filePaths[0],
                        lastOpenTime: new Date().getTime(),
                        auth: info.user || {}
                    });

                    if (this.props.onSelectRepo) {
                        sessionStorage.setItem('current_repo_cwd', filePaths[0]);
                        this.props.onSelectRepo(filePaths[0]);
                    }
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
                this.store.set(info.name, {
                    name: info.name,
                    dir,
                    lastOpenTime: new Date().getTime(),
                    auth: info.user || {}
                });
                if (this.props.onSelectRepo) {
                    sessionStorage.setItem('current_repo_cwd', dir);
                    this.props.onSelectRepo(dir);
                }
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

    async addBranch (dir) {
        await new Promise ((resolve, reject) => {
            ipcRenderer.send('addBranch', {
                name: 'master',
                dir
            });
            ipcRenderer.once('addBranch_res', (event, err) => {
                if (err) {
                    console.log(err);
                    
                    Notification.error({
                        title: 'Add Branch',
                        desc: err,
                        theme: 'danger'
                    });
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    onSelectRepo (item) {
        let target = item;
        if (this.store.get(item.name)) {
            target = this.store.get(item.name);
        }
        target.lastOpenTime = new Date().getTime();
        this.store.set(target.name, target);

        if (this.props.onSelectRepo) {
            sessionStorage.setItem('current_repo_cwd', item.dir);
            this.props.onSelectRepo(item.dir);
        }
    }

    getRepoList () {
        if (!this.store) {
            this.store = new Configstore('c-git');
        }
        const store = this.store;
        const all = store.all;
        const ret = [];
        
        const items = [];
        for (const name in all) {
            const item = all[name];
            items.push(item);
        }
        items.sort((a, b) => {
            if (a.lastOpenTime === undefined) {
                return 1;
            }
            if (b.lastOpenTime === undefined) {
                return -1;
            }
            if (a.lastOpenTime > b.lastOpenTime) {
                return -1;
            }
            if (a.lastOpenTime <= b.lastOpenTime) {
                return 1;
            }
        });
        items.forEach(item => {
            ret.push({
                id: item.dir,
                name: item.name,
                content: <div style={{ flex: 1, whiteSpace: 'nowrap', display: 'flex'}} onClick={this.onSelectRepo.bind(this, item)}>
                    <span>{item.name}</span>
                    <span className='pull-right' style={{flex: 1, textAlign: 'right', paddingLeft: 20}}>{item.dir}</span></div>,
                avatar: <img src={git} width={18}/>
            });
        });
        return ret;
    }

    openConfirm = (data) => {
        this.deleteConfrim.show('Sure to delete this repository ?');
        this.deleteConfrim.setData(data);
    }

    deleteRepo = (flag) => {
        if (flag) {
            const data = this.deleteConfrim.getData();
            this.store.delete(data.name);
            this.setState({
                render: this.state.render + 1
            });
        }
        return true;
    }

    openCreateDialog = () => {
        this.createDialog.open();
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
                    this.store.set(info.name, {
                        name: info.name,
                        dir: params.dir,
                        lastOpenTime: new Date().getTime(),
                        auth: info.user || {}
                    });
                    if (this.props.onSelectRepo) {
                        sessionStorage.setItem('current_repo_cwd', params.dir);
                        this.props.onSelectRepo(params.dir);
                    }
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

    render () {
        const data = this.getRepoList();
        return (
            <Layout style={{flexDirection: 'row'}}>
                <Sider width={500}>
                    <List data={data} actions={[<Button className='delete-repo-btn' key='delete' theme='danger' 
                        icon='trash' title='Delete Repository' onClick={this.openConfirm}/>]}/>
                </Sider>
                <Content>
                    <div className='mt-45 text-center'>
                        <img src={logo} style={{width: 64}}/>
                        <div>C-GIT</div>
                    </div>

                    <div className='mt-50' style={{padding: '30px 50px 0 50px'}}>
                        <Row>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.openRepo}>
                                    <img src={open}/>
                                    <span>Open</span>
                                </div>
                            </Col>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.openCreateDialog}>
                                    <img src={create}/>
                                    <span>Create</span>
                                </div>
                            </Col>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.openCloneDialog}>
                                    <img src={clone}/>
                                    <span>Clone</span>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Content>

                <Dialog ref={f => this.createDialog = f} title='Create Repository' 
                    content={<CreateContent ref={f => this.createContent = f}/>} onConfirm={this.onCreateRepo}/>

                <Dialog ref={f => this.cloneDialog = f} title='Clone Repository' 
                    content={<CloneContent ref={f => this.cloneContent = f}/>} onConfirm={this.onCloneRepo}/>


                <MessageBox ref={f => this.deleteConfrim = f} type='confirm' confirm={this.deleteRepo}/>
            </Layout>
        );
    }
}

export default Welcome;
