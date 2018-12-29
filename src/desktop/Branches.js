import React from 'react';
import Dom from 'r-cmui/components/utils/Dom';
import Dialog from 'r-cmui/components/Dialog';
import MessageBox from 'r-cmui/components/MessageBox';
import Notification from 'r-cmui/components/Notification';
import AddBranch from './branch/AddBranch';
import SetTrackedBranch from './branch/SetTrackedBranch';

const {remote, clipboard, ipcRenderer} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

@inject('branches')
@inject('repo')
@observer
class Branches extends React.Component {
    displayName = 'Branches';

    refresh () {
        this.props.branches.getOrigns(this.props.repo.cwd);
    }

    componentDidMount () {
        this.refresh();

        if (this.props.bind) {
            this.props.bind(this);
        }

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            let menu;
            if (Dom.closest(e.target, '.branches-group') || Dom.closest(e.target, '.branches-sub-node')) {
                menu = new SysMenu();
            }
            if (Dom.closest(e.target, '.branches-sub-node')) {
                let ele = Dom.closest(e.target, '.branches-sub-node');
                ele = Dom.dom(ele);
                const type = ele.data('type');

                if (type === 'local') {
                    menu.append(new MenuItem({label: 'Check Out', click: () => {
                        const name = ele.data('name');
                        this.checkoutBranch(name, type);
                    }}));
                    menu.append(new MenuItem({label: 'Push', click: () => {
                        this.pushCommits();
                    }}));
                    menu.append(new MenuItem({label: 'Delete', 
                        enabled: !ele.hasClass('active'),
                        click: () => {
                            const name = ele.data('name');
                            this.openDeleteConfirm(name, type);
                        }}));
                    menu.append(new MenuItem({label: 'Set Tracked Branch', click: () => {
                        const ref = ele.data('ref');
                        const name = ele.data('name');
                        this.openTrackedDialog(ref,name);
                    }}));
                    menu.append(new MenuItem({label: 'Stop Tracking', click: () => {
                        const ref = ele.data('ref');
                        this.openStopConfirm(ref);
                    }}));
                }
                if (type === 'tag') {
                    menu.append(new MenuItem({label: 'Check Out', click: () => {
                        const name = ele.data('name');
                        this.checkoutBranch(name, type);
                    }}));
                    menu.append(new MenuItem({label: 'Delete', click: () => {
                        const name = ele.data('name');
                        this.openDeleteConfirm(name, type);
                    }}));
                }
                if (type === 'remote') {
                    menu.append(new MenuItem({label: 'Check Out', click: () => {
                        console.log('Check Out');
                    }}));
                    menu.append(new MenuItem({label: 'Log', click: () => {
                        console.log('Log');
                    }}));
                    menu.append(new MenuItem({label: 'Delete', click: () => {
                        console.log('Delete');
                    }}));
                }
                if (type === 'stash') {
                    menu.append(new MenuItem({label: 'Pop', click: async () => {
                        const index = ele.data('index');
                        await this.props.branches.stashPop(parseInt(index, 10));
                    }}));
                    menu.append(new MenuItem({label: 'Apply', click: () => {
                        
                    }}));
                    menu.append(new MenuItem({label: 'Drop', click: () => {
                        
                    }}));
                }
            }
            if (Dom.closest(e.target, '.branches-group') && !Dom.closest(e.target, '.branches-sub-node')) {
                let ele = Dom.closest(e.target, '.branches-group');
                ele = Dom.dom(ele);
                const type = ele.data('type');
                if (type === 'local') {
                    menu.append(new MenuItem({label: 'Add Branch', click: () => {
                        this.openAddBranch();
                    }}));
                }
                if (type === 'remote') {
                    menu.append(new MenuItem({label: 'Properties', click: () => {
                        console.log('Properties');
                    }}));
                }
                if (type === 'tag') {
                    menu.append(new MenuItem({label: 'Add Tag', click: () => {
                        console.log('Add Tag');
                    }}));
                }
            }
            if (Dom.closest(e.target, '.branches-group') || Dom.closest(e.target, '.branches-sub-node')) {
                menu.popup(remote.getCurrentWindow());
            }
        });
    }

    async pushCommits () {
        ipcRenderer.send('push', this.props.repo.cwd);
        ipcRenderer.on('push_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'push错误',
                    desc: err,
                    theme: 'danger'
                });
            }
        });
    }

    async openTrackedDialog (ref, name) {
        const remoteName = await this.props.branches.getRemoteName(ref);
        this.trackedContent.setName(remoteName);
        this.trackedDialog.open();
        this.trackedDialog.setData({
            ref, name
        });
    }

    onSetChackedBranch = (flag) => {
        if (flag) {
            if (this.trackedContent.isValid()) {
                this.trackedDialog.showLoading();
                const data = this.trackedDialog.getData();
                const params = this.trackedContent.getValue();
                this.setTracked(data.ref, data.name, params.remote);
            }
        }
        return false;
    }

    async setTracked (ref, name, remote) {
        try {
            await this.props.branches.setUpstream(ref, remote);
            await this.props.branches.checkoutBranch(name);
        } catch (e) {
            Notification.error({
                title: 'Set Tracked Remote',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            this.trackedDialog.hideLoading();
            this.trackedDialog.close();
        }
    }

    openStopConfirm (ref) {
        this.stopConfirm.show('Sure top tracking?');
        this.stopConfirm.setData(ref);
    }

    stopTracking = async (flag) => {
        if (flag) {
            const ref = this.stopConfirm.getData();
            try {
                await this.props.branches.stopTracking(ref);
            } catch (e) {
                Notification.error({
                    title: 'Stop Tracking',
                    desc: e.message,
                    theme: 'danger'
                });
            }
        }
        return true;
    }

    openDeleteConfirm (name, type) {
        this.deleteConfirm.show(`Sure to delete the ${name} ${type === 'local' ? 'Branch' : 'Tag'}?`);
        this.deleteConfirm.setData({
            name, type
        });
    }

    deleteBranch = async (flag) => {
        if (flag) {
            const params = this.deleteConfirm.getData();
            if (params.type === 'local') {
                await this.props.branches.deleteBranch(params.name);
            } else {
                await this.props.branches.deleteTag(params.name);
            }
        }
        return true;
    }

    openAddBranch () {
        this.addBranchDialog.open();
    }

    onAddBranch = (flag) => {
        if (flag) {
            if (this.addBranchContent.isValid()) {
                this.addBranchDialog.showLoading();
                const params = this.addBranchContent.getValue();
                this.addBranch(params);
            }
            return false;
        }
        return true;
    }

    async addBranch (params, side) {
        params.dir = this.props.repo.cwd;
        ipcRenderer.send('addBranch', params);
        ipcRenderer.on('addBranch_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'Add Branch',
                    desc: err,
                    theme: 'danger'
                });
            } else {
                if (!side) {
                    this.addBranchDialog.hideLoading();
                    this.addBranchDialog.close();
                }
            }
        });
    }

    async checkoutBranch (name, type) {
        try {
            if (type === 'local') {
                await this.props.branches.checkoutBranch(name);
            }
            if (type === 'tag') {
                const has = await this.props.branches.hasBranchName(name);
                if (has) {
                    await this.props.branches.checkoutBranch(name);
                } else {
                    // create branch
                    this.addBranch({
                        dir: this.props.repo.cwd,
                        name
                    }, true);
                }
            }
        } catch (e) {
            Notification.error({
                title: 'Checkout Branch',
                desc: e.message,
                theme: 'danger'
            });
        }
    }

    onSelectNode = (item) => {
        const {selectedNode} = this.props.branches;
        if (item.ref === selectedNode) {
            this.props.branches.setSelectedNode(null);
        } else {
            this.props.branches.setSelectedNode(item.ref);
        }
    }

    onSelectBranch = (branch, type) => {
        if (type === 'branch') {
            this.props.branches.setSelectedSubNode(branch.ref);
        }
    }

    renderSubNodes (nodes, type) {
        const {selectedSubNode} = this.props.branches;
        
        return nodes.map(node => {
            const active = node.ref === selectedSubNode;
            const tip = this.getTitle (node, type);

            let label = node.name;
            if (type === 'local') {
                if (node.remote) {
                    if (node.localOffset || node.remoteOffset) {
                        label = [node.name];
                        if (node.localOffset) {
                            label.push(<span key='localOffset'>{` ${node.localOffset} > `}</span>);
                        }
                        
                        if (node.remoteOffset) {
                            label.push(<span  key='remoteOffset'>{` < ${node.remoteOffset} `}</span>);
                        }
                        label.push(node.remote);
                    } else {
                        label = `${node.name} = ${node.remote}`;
                    }
                }
            }
            return <div title={tip} key={node.ref} 
                data-type={type}
                data-ref={node.ref}
                data-name={node.name}
                data-index={node.index}
                className={`branches-sub-node ${active ? 'active' : ''}`}
                onDoubleClick={this.onSelectBranch.bind(this, node, type)}>
                <span className='branches-arrow-node'></span>
                {label}
            </div>;
        });
    }

    getTitle (node, type) {
        if (type === 'stash') {
            return `Date: ${node.ref}\nMessage: ${node.message}\nAuthor: ${node.author.name()}\nEmail: ${node.author.email()}`;
        } else if (type === 'tag') {
            return `Date: ${node.date}\nMessage: ${node.message}\nAuthor: ${node.author.name()}\nEmail: ${node.author.email()}`;
        }
    }

    renderModules () {
        const {selectedNode, data} = this.props.branches;
        if (!data) {
            return null;
        }
        return toJS(data).map(item => {
            const active = item.ref === selectedNode;
            return <div key={item.ref} data-type={item.type} className={`branches-group ${active ? 'active' : ''}`}>
                <div className='branches-node' onClick={this.onSelectNode.bind(this, item)}>
                    <span className='branches-arrow'></span>
                    {item.name}
                    {item.children && item.children.length ? `(${item.children.length})` : null}
                </div>
                {
                    item.children
                        ? <div style={{display: active ? 'block' : 'none'}}>{this.renderSubNodes(item.children, item.type)}</div>
                        : null
                }
            </div>;
        });
    }

    render () {
        console.log('render branches...');
        return <div style={{padding: '0 10px'}}>
            {this.renderModules()}

            {
                this.props.branches.data
                    ? <Dialog ref={f => this.addBranchDialog = f}
                        title='Add Branch'
                        okButtonText={'add branch'}
                        onConfirm={this.onAddBranch}
                        content={<AddBranch data={this.props.branches.data} ref={f => this.addBranchContent = f}/>}
                    />
                    : null
            }

            {
                this.props.branches.data
                    ? <Dialog ref={f => this.trackedDialog = f}
                        title='Set Tracked Remote'
                        onConfirm={this.onSetChackedBranch}
                        content={<SetTrackedBranch data={this.props.branches.data} ref={f => this.trackedContent = f}/>}
                    />
                    : null
            }

            <MessageBox ref={f => this.deleteConfirm = f} type='confirm' confirm={this.deleteBranch}/>
            <MessageBox ref={f => this.stopConfirm = f} type='confirm' confirm={this.stopTracking}/>
        </div>;
    }
}

export default Branches;
