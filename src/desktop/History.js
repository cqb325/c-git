import React from 'react';
import dg, {adestroy} from '../lib/g';
import Dom from 'r-cmui/components/utils/Dom';
import Dialog from 'r-cmui/components/Dialog';
import Notification from 'r-cmui/components/Notification';
import ResetContent from './history/ResetContent';
import MessageContent from './history/MessageContent';
import AddBranch from './branch/AddBranch';
import AddTag from './history/AddTag';

const {remote, clipboard, ipcRenderer} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

@inject('history')
@inject('branches')
@inject('repo')
@inject('commit')
@observer
class History extends React.Component {
    displayName = 'History';

    refresh (historyFile) {
        this.props.history.getHistory(this.props.repo.cwd, historyFile);
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.historyFile !== this.props.historyFile) {
            this.refresh(nextProps.historyFile);
        }
    }

    componentWillUnmount () {
        document.removeEventListener('contextmenu', this.contextMenu);
    }

    contextMenu = async (e) => {
        e.preventDefault();
        if (Dom.closest(e.target, 'td.commit')) {
            let ele = Dom.closest(e.target, 'td.commit');
            ele = Dom.dom(ele);
            const menu = new SysMenu();
            const parent = ele.parent();
            const commitId = parent.data('commitid');
            const commit = window.gragh.commitsTable[commitId];
            console.log(commit.isLocal);
            
            menu.append(new MenuItem({label: 'Push Commits',
                enabled: !!commit.isLocal && !commit.isSameNode,
                click: () => {
                    this.pushCommits();
                }}));
            menu.append(new MenuItem({label: 'Edit Commit Message',
                enabled: !!commit.isLocal && !commit.isSameNode,
                click: () => {
                    this.openEditMessage(commit);
                }}));
            menu.append(new MenuItem({label: 'Edit Author',
                enabled: !!commit.isLocal && !commit.isSameNode, click: () => {
                
                }}));
            menu.append(new MenuItem({label: 'Add Branch', click: () => {
                this.openAddBranchDialog();
            }}));
            menu.append(new MenuItem({label: 'Add Tag', click: () => {
                this.openAddTagDialog(commitId);
            }}));
            menu.append(new MenuItem({label: 'Reset', click: () => {
                this.openResetDialog(commitId);
            }}));
            menu.append(new MenuItem({label: 'Copy Message', click: async () => {
                const commit = await this.props.history.getCommit(commitId);
                clipboard.writeText(commit.message());
            }}));
                
            menu.popup({window: remote.getCurrentWindow()});
        }
    }

    componentDidMount () {
        this.props.history.getHistory(this.props.repo.cwd, this.props.historyFile);
        if (this.props.bind) {
            this.props.bind(this);
        }

        document.addEventListener('contextmenu', this.contextMenu, false);
    }

    async pushCommits () {
        ipcRenderer.send('push', this.props.repo.cwd);
        ipcRenderer.on('push_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'push错误',
                    desc: err
                });
            }
        });
    }

    openAddBranchDialog () {
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

    async addBranch (params) {
        params.dir = this.props.repo.cwd;
        ipcRenderer.send('addBranch', params);
        ipcRenderer.on('addBranch_res', (event, err) => {
            if (err) {
                Notification.error({
                    title: 'Add Branch',
                    desc: err
                });
            } else {
                this.addBranchDialog.hideLoading();
                this.addBranchDialog.close();
            }
        });
    }

    openAddTagDialog (commitId) {
        this.addTagDialog.open();
        this.addTagDialog.setData(commitId);
    }

    onAddTag = (flag) => {
        if (flag) {
            if (this.addTagContent.isValid()) {
                this.addTagDialog.showLoading();
                const params = this.addTagContent.getValue();
                const commitId = this.addTagDialog.getData();
                params.commitId = commitId;
                this.addTag(params);
            }
            return false;
        }
        return true;
    }

    async addTag (params) {
        try {
            await this.props.history.addTag(params);
        } catch (e) {
            Notification.error({
                title: 'Add Tag',
                desc: e.message
            });
        } finally {
            this.addTagDialog.hideLoading();
            this.addTagDialog.close();
        }
    }

    onClick = (item) => {
        this.props.commit.getCommitInfo(item.sha1);
    }

    openEditMessage (commit) {
        this.messageDialog.open();
        this.messageContent.setMessage(commit.message);
        this.messageDialog.setData(commit);
    }

    onEditMessage = (flag) => {
        if (flag) {
            this.messageDialog.showLoading();
            if (this.messageContent.isValid()) {
                const commit = this.messageDialog.getData();
                const params = this.messageContent.getValue();
                this.editMessage(params.message, commit.sha1);
            }
            return false;
        }
        return true;
    }

    async editMessage (message, oid) {
        console.log(message, oid);
        
        try {
            await this.props.history.editMessage(message, oid);
        } catch (e) {
            Notification.error({
                title: 'Edit Message',
                desc: e.message
            });
        } finally {
            this.messageDialog.hideLoading();
            this.messageDialog.close();
        }
    }

    openResetDialog (commitId) {
        this.resetDialog.open();
        this.resetDialog.setData(commitId);
        this.resetContent.setCommitId(commitId);
    }

    onReset = (flag) => {
        if (flag) {
            const commitId = this.resetDialog.getData();
            this.resetDialog.showLoading();
            const params = this.resetContent.getValue();
            this.reset(commitId, params.type);
            return false;
        }
        return true;
    }

    async reset (id, type) {
        try {
            await this.props.history.reset(id, type);
        } catch (e) {
            console.error(e);
        } finally {
            this.resetDialog.hideLoading();
            this.resetDialog.close();
        }
    }

    closeFileHistory = () => {
        // adestroy();
        this.props.repo.setHistoryFile('');
    }

    renderGragh () {
        let {data} = this.props.history;
        const branchesData = this.props.branches.data;
        if (branchesData && data) {
            data = toJS(data);
            let tags = branchesData.filter(item => {
                return item.ref === 'tags';
            });
            tags = tags[0].children;
            const tagMap = {};
            if (tags) {
                tags.forEach(tag => {
                    if (!tagMap[tag.id]) {
                        tagMap[tag.id] = [];
                    }
                    tagMap[tag.id].push(tag.name);
                });
            }
            data.commits.forEach(item => {
                if (tagMap[item.sha()]) {
                    item.tags = tagMap[item.sha()];
                }
            });
            setTimeout(() => {
                if (data) {
                    dg(toJS(data), {
                        onClick: this.onClick
                    });
                }
            }, 200);
        }
        return null;
    }

    render () {
        console.log('render history...');
        return <div style={{height: '100%'}} className='history-graph'>
            {
                this.props.historyFile
                    ? <div style={{height: 40, lineHeight: '40px', 
                        padding: '0 20px', color: '#eee',
                        borderBottom: '1px solid #aaa'}}>
                        {this.props.historyFile}
                        <span className='history-close pull-right' title='关闭' onClick={this.closeFileHistory}>x</span>
                    </div>
                    : null
            }
            <table width='100%'>
                <tbody>
                    <tr>
                        <td width='100%' className='commits-content'></td>
                    </tr>
                </tbody>
            </table>
            {this.renderGragh()}

            <Dialog title='Reset' 
                ref={f => this.resetDialog = f}
                okButtonText={'reset'}
                onConfirm={this.onReset}
                content={
                    <ResetContent ref={f => this.resetContent = f}/>
                }/>

            <Dialog title='Edit Message' 
                ref={f => this.messageDialog = f}
                okButtonText={'edit'}
                onConfirm={this.onEditMessage}
                content={
                    <MessageContent ref={f => this.messageContent = f}/>
                }/>

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

            <Dialog ref={f => this.addTagDialog = f}
                title='Add Tag'
                okButtonText={'add tag'}
                onConfirm={this.onAddTag}
                content={<AddTag ref={f => this.addTagContent = f}/>}
            />
        </div>;
    }
}

export default History;
