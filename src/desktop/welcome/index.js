import React from 'react';
import Layout from 'r-cmui/components/Layout';
import Sider from 'r-cmui/components/Layout/Sider';
import List from 'r-cmui/components/List';
import Row from 'r-cmui/components/Row';
import Col from 'r-cmui/components/Col';
import Button from 'r-cmui/components/Button';
import Dialog from 'r-cmui/components/Dialog';
import MessageBox from 'r-cmui/components/MessageBox';
import Dom from 'r-cmui/components/utils/Dom';
import RenameContent from './rename';
const Configstore = require('configstore');

import git from '../../images/git.svg';
import logo from '../../images/logo.png';
import open from '../../images/open.svg';
import clone from '../../images/clone.svg';
import create from '../../images/icon-createfolder.svg';
const {Content} = Layout;

const {remote} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

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

    componentDidMount () {
        document.addEventListener('contextmenu', this.contextMenu, false);
    }

    componentWillUnmount () {
        document.removeEventListener('contextmenu', this.contextMenu);
    }

    contextMenu = (e) => {
        e.preventDefault();
        const menu = new SysMenu();
        if (Dom.closest(e.target, '.cm-list-item-body')) {
            let ele = Dom.closest(e.target, '.cm-list-item-body');
            ele = Dom.dom(ele);
            menu.append(new MenuItem({label: 'rename', click: () => {
                const name = ele.data('name');
                this.openRename(name);
            }}));
            menu.append(new MenuItem({label: 'delete', click: () => {
                const name = ele.data('name');
                this.openConfirm({name});
            }}));
            menu.popup({window: remote.getCurrentWindow()});
        }
    }

    getItemByPath (dir) {
        for (const name in this.store.all) {
            const item = this.store.all[name];
            if (item.dir === dir) {
                return item;
            }
        }
        return null;
    }

    onSelectRepo (item) {
        let target = item;
        if (this.store.get(item.name)) {
            target = this.store.get(item.name);
        }
        target.lastOpenTime = new Date().getTime();
        this.store.set(target.name, target);

        if (this.props.onSelectRepo) {
            localStorage.setItem('current_repo_cwd', item.dir);
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
                content: <div data-name={item.name} className='cm-list-item-body' style={{ flex: 1, whiteSpace: 'nowrap', display: 'flex'}} onClick={this.onSelectRepo.bind(this, item)}>
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

    openRename (name) {
        this.renameDialog.open();
        this.renameContent.setData(name);
    }

    render () {
        const data = this.getRepoList();
        return (
            <Layout style={{flexDirection: 'row'}}>
                <Sider width={500} style={{background: '#313641'}}>
                    <List data={data} actions={[<Button className='delete-repo-btn' key='delete' theme='danger' 
                        icon='trash' title='Delete Repository' onClick={this.openConfirm}/>]}/>
                </Sider>
                <Content style={{background: '#252526'}}>
                    <div className='mt-45 text-center'>
                        <img src={logo} style={{width: 64}}/>
                        <div>C-GIT</div>
                    </div>

                    <div className='mt-50' style={{padding: '30px 50px 0 50px'}}>
                        <Row>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.props.parent.openRepo}>
                                    <img src={open}/>
                                    <span>Open</span>
                                </div>
                            </Col>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.props.parent.openCreateDialog}>
                                    <img src={create}/>
                                    <span>Create</span>
                                </div>
                            </Col>
                            <Col grid={1 / 3} className='text-center'>
                                <div className='op-tool-item' onClick={this.props.parent.openCloneDialog}>
                                    <img src={clone}/>
                                    <span>Clone</span>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Content>

                <Dialog title='Rename' ref={f => this.renameDialog = f}
                    onConfirm={this.onRename}
                    content={<RenameContent ref={f => this.renameContent = f}/>}/>
                <MessageBox ref={f => this.deleteConfrim = f} type='confirm' confirm={this.deleteRepo}/>
            </Layout>
        );
    }
}

export default Welcome;
