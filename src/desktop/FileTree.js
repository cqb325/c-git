import React from 'react';
const path = require('path');
import Tree from 'r-cmui/components/Tree';
import Notification from 'r-cmui/components/Notification';
import Dom from 'r-cmui/components/utils/Dom';
import UUID from 'r-cmui/components/utils/UUID';
import utils from '../utils/utils';

const {remote, ipcRenderer} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

@inject('fileTree')
@inject('status')
@observer
class FileTree extends React.Component {
    displayName = 'FileTree';

    componentWillReceiveProps (nextProps) {
        if (nextProps.cwd !== this.props.cwd) {
            this.props.fileTree.getRepoTree(nextProps.cwd);
        }
    }

    refresh () {
        this.props.fileTree.getRepoTree(this.props.cwd);
    }

    componentDidMount () {
        if (this.props.cwd) {
            this.refresh();
        }
        if (this.props.bind) {
            this.props.bind(this);
        }

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (Dom.closest(e.target, '.tree_cont')) {
                let ele = Dom.closest(e.target, '.tree_cont');
                ele = Dom.dom(ele);
                const menu = new SysMenu();
                menu.append(new MenuItem({label: 'Open in Explorer', click: () => {
                    const dir = ele.data('id');
                    utils.openDir('', dir);
                }}));
                menu.append(new MenuItem({label: 'Open in Terminal', click: () => {
                    const dir = ele.data('id');
                    utils.openTerminal(dir);
                }}));
                menu.append(new MenuItem({label: 'Pull', click: () => {
                    this.pull();
                }}));
                menu.append(new MenuItem({label: 'Refresh', click: () => {
                    this.props.fileTree.getRepoTree(this.props.cwd);
                }}));
                menu.append(new MenuItem({label: 'Ignore', click: async () => {
                    const dir = ele.data('id');
                    const dirName = utils.ignoreDirectory(this.props.cwd, dir);
                    if (dirName) {
                        await this.props.fileTree.ignoreDir(dirName);
                        await this.props.status.getStatus(this.props.cwd);
                    }
                }})); 
                menu.append(new MenuItem({label: 'Settings', click: () => {
                    console.log('Settings');
                }}));
                menu.popup(remote.getCurrentWindow());
            }
        });
    }

    pull () {
        ipcRenderer.send('fetchAll', this.props.cwd);
        ipcRenderer.on('fetchAll_res', async (event, err) => {
            if (err) {
                Notification.error({
                    title: 'fetch 错误',
                    desc: err
                });
            } else {
                await this.props.fileTree.pull();
            }
        });
    }

    onSelectDir = (item) => {
        this.props.fileTree.setCurrentDir(path.relative(this.props.cwd, item.path));
    }

    render () {
        const {data} = this.props.fileTree;
        return <div>
            <Tree key={UUID.v4()} data={toJS(data)} onSelect={this.onSelectDir}/>
        </div>;
    }
}

export default FileTree;
