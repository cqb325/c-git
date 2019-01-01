import React from 'react';
import Layout from 'r-cmui/components/Layout';
import Sider from 'r-cmui/components/Layout/Sider';
import List from 'r-cmui/components/List';
import Row from 'r-cmui/components/Row';
import Col from 'r-cmui/components/Col';
import Notification from 'r-cmui/components/Notification';
const Configstore = require('configstore');
const path = require('path');

import git from '../../images/git.svg';
import logo from '../../images/logo.png';
import open from '../../images/open.svg';
import clone from '../../images/clone.svg';
import create from '../../images/icon-createfolder.svg';
import utils from '../../utils/utils';
import GitClient from '../../utils/git';
const { dialog } = require('electron').remote;
const {Content} = Layout;

import './style.less';
import { inject, observer } from 'mobx-react';

@observer
class Welcome extends React.Component {
    displayName = 'Welcome';

    store = null;

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

    createRepo = () => {
        dialog.showOpenDialog({
            title: '选择仓库目录',
            properties: ['openDirectory']
        }, async (filePaths) => {
            if (filePaths) {
                const dir = filePaths[0];
                this.client = new GitClient(dir);
                try {
                    await this.client.init();
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
                }
            }
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
                content: <div style={{ flex: 1}} onClick={this.onSelectRepo.bind(this, item)}><span>{item.name}</span><span className='pull-right'>{item.dir}</span></div>,
                avatar: <img src={git} width={18}/>
            });
        });
        return ret;
    }

    render () {
        const data = this.getRepoList();
        return (
            <Layout style={{flexDirection: 'row'}}>
                <Sider width={500}>
                    <List data={data}/>
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
                                <div className='op-tool-item' onClick={this.createRepo}>
                                    <img src={create}/>
                                    <span>Create</span>
                                </div>
                            </Col>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item'>
                                    <img src={clone}/>
                                    <span>Clone</span>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Content>
            </Layout>
        );
    }
}

export default Welcome;
