import React from 'react';
import Dom from 'r-cmui/components/utils/Dom';
import Dialog from 'r-cmui/components/Dialog';
import MessageBox from 'r-cmui/components/MessageBox';
import Notification from 'r-cmui/components/Notification';
import Accordion from 'r-cmui/components/Accordion';
import AddBranch from './branch/AddBranch';
import SetTrackedBranch from './branch/SetTrackedBranch';
import CheckoutRemoteBranch from './branch/CheckoutRemoteBranch';
import PushBranchToRemote from './branch/PushBranchToRemote';
import PropertyContent from './branch/PropertyContent';
import FinishFeatureContent from './flow/FinishFeatureContent';
import utils from '../utils/utils';

const {remote, ipcRenderer} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

@inject('branches')
@inject('repo')
@observer
class Branches extends React.Component {
    displayName = 'Branches';

    async refresh () {
        try {
            const data = await new Promise((resolve, reject) => {
                ipcRenderer.send('getBranches', this.props.repo.cwd);
                ipcRenderer.once('getBranches_res', (event, err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
            this.props.branches.getOrigns(data, this.props.repo.cwd);
        } catch (e) {
            console.log(e);
            Notification.error({
                title: '获取分支错误',
                desc: e.message,
                theme: 'danger'
            });
        }
    }

    contextMenu = async (e) => {
        e.preventDefault();
        let menu;
        if (Dom.closest(e.target, '.cm-accordion-item-head') || Dom.closest(e.target, '.remote-node-title') || Dom.closest(e.target, '.branches-sub-node')) {
            menu = new SysMenu();
        }
        if (Dom.closest(e.target, '.branches-sub-node')) {
            let ele = Dom.closest(e.target, '.branches-sub-node');
            ele = Dom.dom(ele);
            const type = ele.data('type');

            if (type === 'local') {
                const hasReview = utils.hasReview(this.props.repo.cwd);
                if (hasReview) {
                    menu.append(new MenuItem({label: 'Review', click: () => {
                        const name = ele.data('name');
                        this.review(name);
                    }}));
                }
                menu.append(new MenuItem({label: 'Check Out', click: () => {
                    const name = ele.data('name');
                    this.checkoutBranch(name, type);
                }}));
                menu.append(new MenuItem({label: 'Pull', click: () => {
                    this.pull();
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
                menu.append(new MenuItem({label: 'Stop Tracking',
                    enabled: !!ele.data('remote'),
                    click: () => {
                        const ref = ele.data('ref');
                        this.openStopConfirm(ref);
                    }}));
                menu.append(new MenuItem({label: 'Push to',
                    click: () => {
                        const ref = ele.data('ref');
                        const name = ele.data('name');
                        this.openPushToDialog(ref, name);
                    }}));
            }
            if (type === 'feature') {
                menu.append(new MenuItem({label: 'Check Out', click: () => {
                    const name = ele.data('name');
                    this.checkoutBranch(name, 'local');
                }}));
                menu.append(new MenuItem({label: 'Delete', 
                    enabled: !ele.hasClass('active'),
                    click: () => {
                        const name = ele.data('name');
                        this.openDeleteConfirm(name, 'local');
                    }}));
                menu.append(new MenuItem({label: 'Finish Feature', click: () => {
                    const name = ele.data('name');
                    this.openFinishFeatureDialog(name);
                }}));
            }
            if (type === 'hotfix') {
                menu.append(new MenuItem({label: 'Check Out', click: () => {
                    const name = ele.data('name');
                    this.checkoutBranch(name, 'local');
                }}));
                menu.append(new MenuItem({label: 'Delete', 
                    enabled: !ele.hasClass('active'),
                    click: () => {
                        const name = ele.data('name');
                        this.openDeleteConfirm(name, 'local');
                    }}));
                menu.append(new MenuItem({label: 'Finish HotFix', click: () => {
                    const name = ele.data('name');
                    this.openFinishHotFixDialog(name);
                }}));
            }
            if (type === 'release') {
                menu.append(new MenuItem({label: 'Check Out', click: () => {
                    const name = ele.data('name');
                    this.checkoutBranch(name, 'local');
                }}));
                menu.append(new MenuItem({label: 'Delete', 
                    enabled: !ele.hasClass('active'),
                    click: () => {
                        const name = ele.data('name');
                        this.openDeleteConfirm(name, 'local');
                    }}));
                menu.append(new MenuItem({label: 'Finish Release', click: () => {
                    const name = ele.data('name');
                    this.openFinishReleaseDialog(name);
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
                    const name = ele.data('name');
                    const ref = ele.data('ref');
                    const remote = ele.data('remote');
                    this.openCheckoutRemoteDialog(name, remote, ref);
                }}));
                menu.append(new MenuItem({label: 'Delete', click: () => {
                    const ref = ele.data('ref');
                    this.openDeleteRemoteConfirm(ref);
                }}));
            }
            if (type === 'stash') {
                menu.append(new MenuItem({label: 'Pop', click: async () => {
                    const index = ele.data('index');
                    await this.props.branches.stashPop(parseInt(index, 10));
                }}));
                menu.append(new MenuItem({label: 'Apply', click: () => {
                    const index = ele.data('index');
                    this.stashApply(index);
                }}));
                menu.append(new MenuItem({label: 'Drop', click: async () => {
                    const index = ele.data('index');
                    this.stashDrop(index);
                }}));
            }
        }
        if ((Dom.closest(e.target, '.cm-accordion-item-head')
        || Dom.closest(e.target, '.remote-node-title')) 
            && !Dom.closest(e.target, '.branches-sub-node')) {
            let ele = Dom.closest(e.target, '.cm-accordion-item-head');
            let remoteEle = Dom.closest(e.target, '.remote-node-title');
            ele = ele ? Dom.dom(ele) : null;
            remoteEle = remoteEle ? Dom.dom(remoteEle) : null;
            const type = ele ? ele.data('type') : null;
            const remoteType = remoteEle ? remoteEle.data('type') : null;
            
            if (type === 'local') {
                menu.append(new MenuItem({label: 'Add Branch', click: () => {
                    this.openAddBranch();
                }}));
            }
            if (remoteType === 'remote') {
                menu.append(new MenuItem({label: 'Properties', click: () => {
                    const name = remoteEle.data('name');
                    this.openPropertiesDialog(name);
                }}));
            }
            if (type === 'tag') {
                menu.append(new MenuItem({label: 'Add Tag', click: () => {
                    console.log('Add Tag');
                }}));
            }
        }
        if (Dom.closest(e.target, '.cm-accordion-item-head') || Dom.closest(e.target, '.remote-node-title') || Dom.closest(e.target, '.branches-sub-node')) {
            menu.popup({window: remote.getCurrentWindow()});
        }
    }

    componentWillUnmount () {
        document.removeEventListener('contextmenu', this.contextMenu);
    }

    componentDidMount () {
        this.refresh();

        if (this.props.bind) {
            this.props.bind(this);
        }

        document.addEventListener('contextmenu', this.contextMenu, false);
    }

    openFinishFeatureDialog (name) {
        this.finishFeatureContent.setName(name);
        this.finishFeatureDialog.open();
        this.finishFeatureDialog.setData(name);
    }

    onFinishFeature = (flag) => {
        if (flag) {
            if (this.finishFeatureContent.isValid()) {
                this.finishFeatureDialog.showLoading();
                const featureName = this.finishFeatureDialog.getData();
                const params = this.finishFeatureContent.getValue();
                params.name = featureName;
                this.finishFeature(params);
            }
            return false;
        }
        return true;
    }

    /**
     * 结束feature
     * @param {*} params 
     */
    async finishFeature (params) {
        try {
            await this.props.branches.finishFeature(params);
        } catch (e) {
            console.log(e);
            
            Notification.error({
                title: 'Finish Feature Error',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            this.finishFeatureDialog.hideLoading();
            this.finishFeatureDialog.close();
        }
    }

    openFinishReleaseDialog (name) {
        this.finishReleaseContent.setName(name);
        this.finishReleaseDialog.open();
        this.finishReleaseDialog.setData(name);
    }

    onFinishRelease = (flag) => {
        if (flag) {
            if (this.finishReleaseContent.isValid()) {
                this.finishReleaseDialog.showLoading();
                const featureName = this.finishReleaseDialog.getData();
                const params = this.finishReleaseContent.getValue();
                params.name = featureName;
                this.finishRelease(params);
            }
            return false;
        }
        return true;
    }

    /**
     * 结束feature
     * @param {*} params 
     */
    async finishRelease (params) {
        try {
            await this.props.branches.finishRelease(params);
        } catch (e) {
            Notification.error({
                title: 'Finish Release Error',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            this.finishReleaseDialog.hideLoading();
            this.finishReleaseDialog.close();
        }
    }

    openFinishHotFixDialog (name) {
        this.finishHotFixContent.setName(name);
        this.finishHotFixDialog.open();
        this.finishHotFixDialog.setData(name);
    }

    onFinishHotFix = (flag) => {
        if (flag) {
            if (this.finishHotFixContent.isValid()) {
                this.finishHotFixDialog.showLoading();
                const featureName = this.finishHotFixDialog.getData();
                const params = this.finishHotFixContent.getValue();
                params.name = featureName;
                this.finishHotFix(params);
            }
            return false;
        }
        return true;
    }

    /**
     * 结束HotFix
     * @param {*} params 
     */
    async finishHotFix (params) {
        try {
            await this.props.branches.finishHotFix(params);
        } catch (e) {
            Notification.error({
                title: 'Finish HotFix Error',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            this.finishHotFixDialog.hideLoading();
            this.finishHotFixDialog.close();
        }
    }

    /**
     * 打开remote属性信息
     * @param {*} name 
     */
    async openPropertiesDialog (name) {
        const remote = await this.props.branches.getRemote(name);
        this.propertyContent.setData(remote);
        this.propertyDialog.open();
        this.propertyDialog.setData(name);
    }

    onChangeRemoteURL = (flag) => {
        if (flag) {
            if (this.propertyContent.isValid() && this.propertyContent.isChanged()) {
                this.propertyDialog.showLoading();
                const name = this.propertyDialog.getData();
                const data = this.propertyContent.getValue();
                data.name = name;
                this.changeRemoteURL(data);
            }
            return false;
        }
        return true;
    }

    /**
     * 切换远程地址
     * @param {*} data 
     */
    async changeRemoteURL (data) {
        // data.dir = this.props.repo.cwd;
        try {
            await this.props.branches.setRemoteURL(data);
        } catch (e) {
            console.log(e);
            Notification.error({
                title: 'Set Remote URL Error',
                desc: e.message,
                theme: 'danger'
            });
        } finally {
            this.propertyDialog.hideLoading();
            this.propertyDialog.close();
        }
    }

    /**
     * drop stash
     * @param {*} index stash index
     */
    async stashDrop (index) {
        try {
            await this.props.branches.stashDrop(parseInt(index, 10));
        } catch (e) {
            Notification.error({
                title: 'Drop Stash Error',
                desc: e.message,
                theme: 'danger'
            });
        }
    }

    /**
     * apply stash
     * @param {*} index stash index
     */
    async stashApply (index) {
        try {
            await this.props.branches.stashApply(parseInt(index, 10));
        } catch (e) {
            Notification.error({
                title: 'Apply Stash Error',
                desc: e.message,
                theme: 'danger'
            });
        }
    }

    openCheckoutRemoteDialog (name, remote, ref) {
        this.remoteDialog.open();
        this.remoteContent.setData({
            name,
            ref,
            remote
        });
        this.remoteDialog.setData(`${remote}/${name}`);
    }

    onCheckoutRemoteBranch = (flag) => {
        if (flag) {
            if (this.remoteContent.isValid()) {
                this.remoteDialog.showLoading();
                const data = this.remoteContent.getValue();
                const ref = this.remoteDialog.getData();
                data.ref = ref;
                if (this.checkNameExist(data.name)) {
                    this.tip.show(`branch ${data.name} has exsit, please input an other name!`);
                    this.remoteDialog.hideLoading();
                } else {
                    this.checkoutRemoteBranch(data);
                }
            }
            return false;
        }
        return true;
    }

    /**
     * 检出远程分支
     * @param {*} data 
     */
    checkoutRemoteBranch (data) {
        data.dir = this.props.repo.cwd;
        ipcRenderer.send('checkoutRemote', data);
        ipcRenderer.once('checkoutRemote_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'Checkout Remote Error',
                    desc: err,
                    theme: 'danger'
                });
            }
            this.remoteDialog.hideLoading();
            this.remoteDialog.close();
        });
    }

    async openPushToDialog (ref, name) {
        const remotes = await this.props.branches.getRemotes();
        this.pushRemoteContent.setData({
            remotes,
            name
        });
        this.pushRemoteDialog.open();
        this.pushRemoteDialog.setData({
            ref, name
        });
    }

    onPushBranchToRemote = (flag) => {
        if (flag) {
            if (this.pushRemoteContent.isValid()) {
                this.pushRemoteDialog.showLoading();
                const data = this.pushRemoteDialog.getData();
                const value = this.pushRemoteContent.getValue();
                data.remote = value.remote;

                this.pushBranchToRemote(data);
            }
            return false;
        }
        return true;
    }

    async pushBranchToRemote (data) {
        data.dir = this.props.repo.cwd;
        ipcRenderer.send('pushToRemote', data);
        ipcRenderer.once('pushToRemote_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'Push Branch To Remote',
                    desc: err,
                    theme: 'danger'
                });
            }
            this.pushRemoteDialog.hideLoading();
            this.pushRemoteDialog.close();
        });
    }

    checkNameExist (name) {
        const data = this.props.branches.data;
        const branchData = toJS(data);
        const arr = branchData.branches.filter(branch => {
            return branch.name === name;
        });
        return arr && arr.length;
    }

    pull () {
        ipcRenderer.send('fetchAll', this.props.repo.cwd);
        ipcRenderer.once('fetchAll_res', async (event, err) => {
            if (err) {
                Notification.error({
                    title: 'fetch 错误',
                    desc: err,
                    theme: 'danger'
                });
            } else {
                await this.props.branches.pull();
            }
        });
    }

    async openDeleteRemoteConfirm (name) {
        this.deleteRemoteConfirm.show(`Sure to delete remote ${name}`);
        this.deleteRemoteConfirm.setData(name);
    }

    onDeleteRemote = async (flag) => {
        if (flag) {
            this.deleteRemoteConfirm.showLoading();
            const refName = this.deleteRemoteConfirm.getData();
            try {
                await this.props.branches.deleteRemote(refName);
            } catch (e) {
                Notification.error({
                    title: 'Delete Remote Error',
                    desc: e.message,
                    theme: 'danger'
                });
            }
            this.deleteRemoteConfirm.hideLoading();
        }
        return true;
    }

    async review (name) {
        try {
            const info = await this.props.branches.review(name);
            Notification.info({
                title: 'Review',
                desc: info,
                theme: 'success'
            });
        } catch (e) {
            Notification.error({
                title: 'Review',
                desc: e,
                theme: 'danger'
            });
        }
    }

    async pushCommits () {
        ipcRenderer.send('push', this.props.repo.cwd);
        ipcRenderer.once('push_res', (event, err) => {
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
        ipcRenderer.once('addBranch_res', (event, err) => {
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
                            label.push(<span className='local-offset' key='localOffset'>{` ${node.localOffset} > `}</span>);
                        }
                        
                        if (node.remoteOffset) {
                            label.push(<span className='remote-offset' key='remoteOffset'>{` < ${node.remoteOffset} `}</span>);
                        }
                        label.push(<span key='remote' className='remote-name'>{node.remote}</span>);
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
                data-remote={node.remote}
                className={`branches-sub-node ${active ? 'active' : ''}`}
                onDoubleClick={this.onSelectBranch.bind(this, node, type)}>
                <span className='branches-arrow-node'></span>
                {label}
            </div>;
        });
    }

    getTitle (node, type) {
        if (type === 'stash') {
            return `Date: ${node.ref}\nMessage: ${node.message}\nAuthor: ${node.author.name}\nEmail: ${node.author.email}`;
        } else if (type === 'tag') {
            return `Date: ${node.date}\nMessage: ${node.message}\nAuthor: ${node.author.name}\nEmail: ${node.author.email}`;
        }
    }

    renderModules () {
        const {data} = this.props.branches;
        if (!data) {
            return null;
        }
        // return toJS(data).map(item => {
        //     const title = item.ref === '';
        //     return <div key={item.ref} data-type={item.type} className={`branches-group ${active ? 'active' : ''}`}>
        //         <div className='branches-node' onClick={this.onSelectNode.bind(this, item)}>
        //             <span className='branches-arrow'></span>
        //             {item.name}
        //             {item.children && item.children.length ? `(${item.children.length})` : null}
        //             {item.url ? ` - ${item.url}` : ''}
        //         </div>
        //         {
        //             item.children
        //                 ? <div style={{display: active ? 'block' : 'none'}}>{this.renderSubNodes(item.children, item.type)}</div>
        //                 : null
        //         }
        //     </div>;
        // });
        const branchData = toJS(data);
        const ret = [];
        const local = this.renderLocal(branchData.branches);
        const flow = this.renderFlow(branchData.flows);
        const remotes = this.renderRemotes(branchData.remotes);
        if (flow) {
            ret.push(flow);
        }
        if (local) {
            ret.push(local);
        }
        ret.push(remotes);
        if (branchData.tags && branchData.tags.length) {
            const tags = this.renderTags(branchData.tags);
            ret.push(tags);
        }
        if (branchData.stashes && branchData.stashes.length) {
            const stashes = this.renderStashes(branchData.stashes);
            ret.push(stashes);
        }
        return ret;
    }

    renderLocal (branches) {
        if (!branches || !branches.length) {
            return null;
        }
        const {selectedSubNode} = this.props.branches;
        return <Accordion.Item key='LOCAL' title='LOCAL' icon='desktop' dataType='local' suffix={<span style={{fontSize: 11, color: '#8080AD'}}>{branches.length}</span>} open>
            {
                branches.map(branch => {
                    const active = branch.ref === selectedSubNode;
                    let type = 'local';
                    if (branch.isFeature) {
                        type = 'feature';
                    }
                    if (branch.isRelease) {
                        type = 'release';
                    }
                    if (branch.isHotFix) {
                        type = 'hotfix';
                    }
                    return <div key={branch.ref}>
                        <div className={`branches-sub-node ${active ? 'active' : ''} ${branch.isTracked ? '' : 'no-track'}`}
                            data-type={type}
                            data-ref={branch.ref}
                            data-name={branch.name}
                            data-index={branch.index}
                            data-target={branch.target}
                            data-remote={branch.remote}
                        >
                            <span className='branches-arrow-node'></span>
                            <span className='branches-icon'></span>
                            <span>{branch.name}</span>
                            <span className='pull-right mr-10' style={{fontSize: 9, fontWeight: 400}}>
                                {
                                    branch.localOffset
                                        ? <span>
                                            <span style={{marginRight: 2, color: '#8080AD'}}>{branch.localOffset}</span>
                                            <i className='zmdi zmdi-arrow-right-top mr-5' style={{color: '#8080AD'}}></i>
                                        </span>
                                        : null
                                }
                                {
                                    branch.remoteOffset
                                        ? <span>
                                            <i className='zmdi zmdi-arrow-left-bottom' style={{color: '#E9C341'}}></i>
                                            <span style={{marginLeft: 2, color: '#E9C341'}}>{branch.remoteOffset}</span>
                                        </span>
                                        : null
                                }
                                
                            </span>
                        </div>
                    </div>;
                })
            }
        </Accordion.Item>;
    }

    renderFlow (branches) {
        if (!branches) {
            return null;
        }
        const {selectedSubNode} = this.props.branches;
        return <Accordion.Item key='FLOW' title='FLOW' icon='leaf' dataType='flow' suffix={<span style={{fontSize: 11, color: '#8080AD'}}>{branches.length}</span>} open>
            {
                branches.map(branch => {
                    const active = branch.ref === selectedSubNode;
                    return <div key={branch.ref}>
                        <div className={`branches-sub-node ${active ? 'active' : ''} ${branch.isTracked ? '' : 'no-track'}`}
                            data-type='local'
                            data-ref={branch.ref}
                            data-name={branch.name}
                            data-index={branch.index}
                            data-target={branch.target}
                            data-remote={branch.remote}
                        >
                            <span className='branches-arrow-node'></span>
                            <span className='branches-icon'></span>
                            <span>{branch.name}</span>
                            <span className='pull-right mr-10' style={{fontSize: 9, fontWeight: 400}}>
                                {
                                    branch.localOffset
                                        ? <span>
                                            <span style={{marginRight: 2, color: '#8080AD'}}>{branch.localOffset}</span>
                                            <i className='zmdi zmdi-arrow-right-top mr-5' style={{color: '#8080AD'}}></i>
                                        </span>
                                        : null
                                }
                                {
                                    branch.remoteOffset
                                        ? <span>
                                            <i className='zmdi zmdi-arrow-left-bottom' style={{color: '#E9C341'}}></i>
                                            <span style={{marginLeft: 2, color: '#E9C341'}}>{branch.remoteOffset}</span>
                                        </span>
                                        : null
                                }
                                
                            </span>
                        </div>
                    </div>;
                })
            }
        </Accordion.Item>;
    }

    renderRemotes (remotes) {
        let length = 0;
        const arr = [];
        for (const name in remotes) {
            length += remotes[name].length;
            const remote = remotes[name];
            const remoteEle = <div key={name} className={'remote-node'}>
                <div className={'remote-node-title'} 
                    data-type={'remote'} data-name={name}>
                    <span className='branches-arrow-node'></span>
                    <span className='remote-icon branches-icon'></span>
                    <span>{name}</span>
                </div>

                {
                    remote.map(item => {
                        return <div key={item.ref} className={'branches-sub-node'}
                            data-type='remote'
                            data-ref={item.ref}
                            data-name={item.name}
                            data-index={item.index}
                            data-remote={item.remote}
                        >
                            <span className='branches-arrow-node'></span>
                            <span className='branches-icon'></span>
                            <span>{item.name}</span>
                        </div>;
                    })
                }
            </div>;
            arr.push(remoteEle);
        }
        return <Accordion.Item key='REMOTE' title='REMOTE' icon='cloud' suffix={<span style={{fontSize: 11, color: '#8080AD'}}>{length}</span>} open>
            {arr}
        </Accordion.Item>;
    }

    renderTags (tags) {
        return <Accordion.Item key='TAGS' title='TAGS' icon='tag' suffix={<span style={{fontSize: 11, color: '#8080AD'}}>{tags.length}</span>} open>
            {
                tags.map(tag => {
                    const tip = this.getTitle (tag, 'tag');
                    return <div key={tag.ref} title={tip}>
                        <div className={'branches-sub-node'}
                            data-type='tag'
                            data-ref={tag.ref}
                            data-name={tag.name}
                            data-index={tag.index}
                            data-remote={tag.remote}
                        >
                            <span className='branches-arrow-node'></span>
                            <span className='branches-icon'></span>
                            <span>{tag.name}</span>
                        </div>
                    </div>;
                })
            }
        </Accordion.Item>;
    }

    renderStashes (stashes) {
        return <Accordion.Item key='STASHES' title='STASHES' data-type='stash' icon='hdd-o' suffix={<span style={{fontSize: 11, color: '#8080AD'}}>{stashes.length}</span>} open>
            {
                stashes.map(stash => {
                    const tip = this.getTitle (stash, 'tag');
                    return <div key={stash.ref} title={tip}>
                        <div className={'branches-sub-node'}
                            data-type='stash'
                            data-ref={stash.ref}
                            data-name={stash.name}
                            data-index={stash.index}
                            data-remote={stash.remote}
                        >
                            <span className='branches-arrow-node'></span>
                            <span className='branches-icon'></span>
                            <span>{stash.name}</span>
                        </div>
                    </div>;
                })
            }
        </Accordion.Item>;
    }

    render () {
        console.log('render branches...');
        return <div style={{padding: 0}}>
            <Accordion>{this.renderModules()}</Accordion>
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

            {
                this.props.branches.data
                    ? <Dialog ref={f => this.remoteDialog = f}
                        title='Checkout Remote Branch'
                        onConfirm={this.onCheckoutRemoteBranch}
                        content={<CheckoutRemoteBranch data={this.props.branches.data} ref={f => this.remoteContent = f}/>}
                    />
                    : null
            }

            <Dialog ref={f => this.pushRemoteDialog = f}
                title='Put Branch to Remote'
                onConfirm={this.onPushBranchToRemote}
                content={<PushBranchToRemote ref={f => this.pushRemoteContent = f}/>}
            />

            <Dialog ref={f => this.propertyDialog = f}
                title='Properties'
                onConfirm={this.onChangeRemoteURL}
                content={<PropertyContent ref={f => this.propertyContent = f}/>}
            />

            <Dialog ref={f => this.finishFeatureDialog = f}
                title='Finish Feature'
                okButtonText='Finish'
                onConfirm={this.onFinishFeature}
                content={<FinishFeatureContent type='feature' ref={f => this.finishFeatureContent = f}/>}
            />

            <Dialog ref={f => this.finishReleaseDialog = f}
                title='Finish Release'
                okButtonText='Finish'
                onConfirm={this.onFinishRelease}
                content={<FinishFeatureContent type='release' ref={f => this.finishReleaseContent = f}/>}
            />

            <Dialog ref={f => this.finishHotFixDialog = f}
                title='Finish HotFix'
                okButtonText='Finish'
                onConfirm={this.onFinishHotFix}
                content={<FinishFeatureContent type='hotfix' ref={f => this.finishHotFixContent = f}/>}
            />

            <MessageBox ref={f => this.deleteConfirm = f} type='confirm' confirm={this.deleteBranch}/>
            <MessageBox ref={f => this.stopConfirm = f} type='confirm' confirm={this.stopTracking}/>
            <MessageBox ref={f => this.deleteRemoteConfirm = f} type='confirm' confirm={this.onDeleteRemote}/>
            <MessageBox ref={f => this.tip = f} />
        </div>;
    }
}

export default Branches;
