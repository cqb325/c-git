import React from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import Dom from 'r-cmui/components/utils/Dom';
import Dialog from 'r-cmui/components/Dialog';
import Notification from 'r-cmui/components/Notification';
import Button from 'r-cmui/components/Button';
import StashContent from './status/StashContent';
import IgnoreContent from './status/IgnoreContent';
import CommitCotent from './status/CommitCotent';
import utils from '../utils/utils';
const path = require('path');

const {remote} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

@inject('status')
@inject('repo')
@inject('commit')
@inject('fileTree')
@observer
class Status extends React.Component {
    displayName = 'Status';

    lastStagedIndex = 0;

    refresh () {
        const dir = this.props.repo.cwd;
        this.props.status.getStatus(dir);
    }

    componentWillMount () {
        const dir = this.props.repo.cwd;
        this.props.status.getDefaultCommitTemplate(dir);
    }

    contextMenu = async (e) => {
        e.preventDefault();
        if (Dom.closest(e.target, '.status-item')) {
            let ele = Dom.closest(e.target, '.status-item');
            ele = Dom.dom(ele);
            if (!ele.hasClass('selected')) {
                const filePath = ele.data('path');
                const files = this.data.filter((item, index) => {
                    if (item.path === filePath) {
                        this.lastStagedIndex = index;
                    }
                    return item.path === filePath;
                });
                if (files && files.length) {
                    this.props.status.setCurrentFile(files[0]);
                }
            }
            
            const state = ele.data('state');
            const type = ele.data('type');
            
            setTimeout(() => {
                const hasUntracked = this.hasSelectedUntracked();
                const menu = new SysMenu();
                menu.append(new MenuItem({label: 'Show Changes',
                    enabled: !(type === 'WT' && state === 'NEW'),
                    click: () => {
                        const filePath = ele.data('path');
                        this.props.status.getDiffText(filePath);
                    }}));
                menu.append(new MenuItem({label: 'Open', click: () => {
                    const dir = ele.data('dir');
                    utils.openDir(this.props.repo.cwd, dir);
                }}));
                menu.append(new MenuItem({label: 'Log', 
                    enabled: !(type === 'WT' && state === 'NEW'),
                    click: () => {
                        const filePath = ele.data('path');
                        this.props.repo.setHistoryFile(filePath);
                    }}));
                menu.append(new MenuItem({label: 'Commit', click: () => {
                    this.openCommitDialog();
                }}));
                menu.append(new MenuItem({label: 'Stage', enabled: type !== 'INDEX', click: () => {
                    this.props.status.stage();
                }}));
                menu.append(new MenuItem({label: 'UnStage', enabled: type !== 'WT', click: () => {
                    this.props.status.unStage();
                }}));
                menu.append(new MenuItem({label: 'Ignore',
                    enabled: type === 'WT' && state === 'NEW',
                    click: () => {
                        const filePath = ele.data('path');
                        this.openIgnore(filePath);
                    }}));
                menu.append(new MenuItem({label: 'Discard', 
                    enabled: !hasUntracked,
                    click: () => {
                        this.props.status.discardFile();
                    }}));
                menu.popup(remote.getCurrentWindow());
            }, 0);
        }
    }

    componentDidMount () {
        document.addEventListener('keyup', this.onKeyUp, false);
        document.addEventListener('keydown', this.onKeyDown, false);

        if (this.props.bind) {
            this.props.bind(this);
        }
        const dir = this.props.repo.cwd;
        this.props.status.getStatus(dir);

        document.addEventListener('contextmenu', this.contextMenu, false);
    }

    componentWillUnmount () {
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('contextmenu', this.contextMenu);
    }

    hasSelectedUntracked () {
        const selectedFiles = this.props.status.selectedFiles;
        let hasUntracked = false;
        selectedFiles.forEach(item => {
            if (item.status === 'WT_NEW') {
                hasUntracked = true;
            }
        });
        return hasUntracked;
    }

    openStashDialog = () => {
        this.stashDialog.open();
    }

    openIgnore = (filePath) => {
        this.ignoreDialog.open();
        this.ignoreDialog.setData(filePath);
        const fileName = path.basename(filePath);
        this.ignoreContent.setPath(fileName);
    }

    async openCommitDialog () {
        const {selectedFiles} = this.props.status;
        const states = selectedFiles.map(state => {
            return state.path;
        });
        
        this.commitContent.setFiles(states);
        
        this.commitDialog.open();
        this.commitDialog.setData(states);
    }

    onKeyDown = (e) => {
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            return false;
        }
        return true;
    }

    onKeyUp = (e) => {
        if (e.ctrlKey && e.keyCode === 65) {
            const es = Dom.queryAll('.status-item');
            if (es.length) {
                const eles = Dom.dom(es);
                eles.addClass('selected');
                const {status} = this.props;
                status.addAllSelectFile(this.data);
            }
            return false;
        }
    }

    onClick = (state, index, e) => {
        const {status} = this.props;
        if (e.ctrlKey) {
            e.preventDefault();
            const ele = Dom.closest(e.target, '.status-item');
            if (Dom.dom(ele).hasClass('selected')) {
                status.removeSelectFile(state);
            } else {
                status.addSelectFile(state);
            }
            return false;
        }
        if (e.shiftKey) {
            e.preventDefault();
            const arr = [this.lastStagedIndex, index];
            arr.sort();
            const files = [];
            for (let i = arr[0]; i <= arr[1]; i++) {
                files.push(this.data[i]);
            }
            status.addAllSelectFile(files);
            return false;
        }
        status.setCurrentFile(state);
        this.lastStagedIndex = index;
    }

    onStash = (flag) => {
        if (flag) {
            if (this.stashContent.isValid()) {
                const params = this.stashContent.getValue();
                this.stashDialog.showLoading();
            
                this.stashFiles(params.message);
                return false;
            }
            return true;
        }
        return true;
    }

    clearIndex = () => {
        this.props.status.clearIndex();
    }

    onIgnore = (flag) => {
        if (flag) {
            if (this.ignoreContent.isValid()) {
                this.ignoreDialog.showLoading();
                const params = this.ignoreContent.getValue();
                this.ignore(params.rule);
            }
            return false;
        }
        return true;
    }

    async ignore (rule) {
        await this.props.status.ignore(rule);
        this.ignoreDialog.hideLoading();
        this.ignoreDialog.close();
    }

    onCommit = (flag) => {
        if (flag) {
            if (this.commitContent.isValid()) {
                this.commitDialog.showLoading();
                const params = this.commitContent.getValue();
                this.commit(params.message);
            }
            return false;
        }

        return true;
    }

    async commit (message) {
        const states = this.commitDialog.getData();
        await this.props.status.commit(states, message);
        if (this.props.onCommit) {
            this.props.onCommit();
        }
        this.commitDialog.hideLoading();
        this.commitDialog.close();
    }

    /**
     * stash 文件
     * @param {*} states 
     */
    async stashFiles (message) {
        try {
            await this.props.status.stashFiles(message);
        } catch (e) {
            Notification.error({
                title: 'Stash Error',
                theme: 'danger',
                dock: 'bottomRight',
                desc: e.message
            });
        } finally {
            this.stashDialog.hideLoading();
            this.stashDialog.close();
        }
    }

    renderFiles () {
        const {status, selectedFiles} = this.props.status;
        const {currentDir} = this.props.fileTree;
        if (status) {
            let data = status;
            data = status.filter(state => {
                if (state.path.indexOf(currentDir) === 0) {
                    if (!state.status) {
                        return true;
                    }
                    if (state.status.indexOf('IGNORED') === -1) {
                        return true;
                    }
                }
                return false;
            });
            this.data = data;
            return data.map((state, index) => {
                let sta = state.status || 'WT_DELETED';
                let type = '';
                if (sta.indexOf('WT_') !== -1) {
                    sta = sta.replace('WT_', '');
                    type = 'WT';
                }
                if (sta.indexOf('INDEX_') !== -1) {
                    type = 'INDEX';
                    if (sta.indexOf('MODIFIED') !== -1) {
                        sta = 'STAGED';
                    } else {
                        sta = sta.replace('INDEX_', '');
                    }
                }
                let label = sta;
                if (type === 'WT' && sta === 'NEW') {
                    label = 'Untracked';
                }
                if (type === 'INDEX' && sta === 'NEW') {
                    label = 'ADD';
                }
                const actives = selectedFiles.filter(item => {
                    return item.path === state.path;
                });
                const active = actives.length;

                const dir = path.dirname(state.path);
                return <tr key={state.path} className={`status-item ${active ? 'selected' : ''}`}
                    data-dir={dir}
                    data-state={sta}
                    data-type={type}
                    data-path={state.path}
                    onClick={this.onClick.bind(this, state, index)}
                >
                    <td title={state.path}><div>{state.name}</div></td>
                    <td className={`${type} ${sta}`}>{label}</td>
                </tr>;
            });
        }
        return null;
    }

    render () {
        const {data} = this.props.commit;
        const {template} = this.props.status;
        return <div style={{height: '100%', overflow: 'auto', display: data ? 'none' : 'block'}} className='status-wrap'>
            <div>
                <Button flat icon='cube' onClick={this.openStashDialog}>stash</Button>
            </div>
            <table style={{width: '100%'}} className='status-table'>
                <thead>
                    <tr>
                        <td>Name</td>
                        <td style={{width: 110}}>Stage</td>
                    </tr>
                </thead>
                <tbody>
                    {this.renderFiles()}
                </tbody>
            </table>

            <Dialog title='Stash Message'
                ref={f => this.stashDialog = f}
                content={<StashContent ref={f => this.stashContent = f}/>}
                onConfirm={this.onStash}
            />

            <Dialog title='Ignore'
                ref={f => this.ignoreDialog = f}
                content={<IgnoreContent ref={f => this.ignoreContent = f}/>}
                onConfirm={this.onIgnore}
            />

            <Dialog title='Commit'
                ref={f => this.commitDialog = f}
                content={<CommitCotent ref={f => this.commitContent = f} template={template}/>}
                onConfirm={this.onCommit}
            />
        </div>;
    }
}

export default Status;
