import React from 'react';
import UUID from 'r-cmui/components/utils/UUID';
import Dom from 'r-cmui/components/utils/Dom';
import utils from '../utils/utils';
const path = require('path');
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

const {remote, clipboard} = require('electron');
const SysMenu = remote.Menu;
const MenuItem = remote.MenuItem;

@inject('commit')
@inject('repo')
@observer
class CommitInfo extends React.Component {
    displayName = 'CommitInfo';

    componentDidMount () {
        this.props.commit.setCwd(this.props.repo.cwd);

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (Dom.closest(e.target, '.commit-info-line')) {
                let ele = Dom.closest(e.target, '.commit-info-line');
                ele = Dom.dom(ele);
                const menu = new SysMenu();
                const {data} = this.props.commit;
                const commit = data.commit;
                menu.append(new MenuItem({label: 'Show Changes', click: () => {
                    const filePath = ele.data('path');
                    this.props.commit.getDiffText(filePath, commit.sha());
                }}));
                menu.append(new MenuItem({label: 'Open', click: () => {
                    const dir = ele.data('dir');
                    utils.openDir(this.props.repo.cwd, dir);
                }}));
                menu.append(new MenuItem({label: 'Log', click: () => {
                    const filePath = ele.data('path');
                    this.props.repo.setHistoryFile(filePath);
                }}));
                menu.append(new MenuItem({label: 'Copy Name', click: () => {
                    clipboard.writeText(ele.data('name'));
                }}));
                menu.append(new MenuItem({label: 'Copy Relative Path', click: () => {
                    clipboard.writeText(ele.data('dir'));
                }}));
                menu.popup(remote.getCurrentWindow());
            }
        });
    }

    close = () => {
        this.props.commit.setData(null);
    }

    renderFiles (patches) {
        patches = toJS(patches);
        return patches.map(patch => {
            let modifition = '';
            let filePath = '';
            if (patch.isAdded()) {
                modifition = 'Added';
                filePath = patch.newFile().path();
            }
            if (patch.isModified()) {
                modifition = 'Modified';
                filePath = patch.newFile().path();
            }
            if (patch.isDeleted()) {
                modifition = 'Deleted';
                filePath = patch.oldFile().path();
            }
            if (!filePath) {
                filePath = patch.oldFile().path();
            }
            let name = '';
            let relative = '';
            if (filePath) {
                name = path.basename(filePath);
                relative = path.dirname(filePath);
            }
            return <tr key={UUID.v4()} className='commit-info-line' 
                data-dir={relative}
                data-path={filePath}
                data-name={name}
            >
                <td title={`dir: ${relative}`}>{name}</td>
                <td className={modifition}>{modifition}</td>
            </tr>;
        });
    }

    render () {
        const {data} = this.props.commit;
        if (data) {
            const commit = data.commit;
            const patches = data.patches;
            return <div style={{height: '100%', overflow: 'auto'}} className='commit-wrap'>
                <div className='commit-header'>
                    <span>{commit.sha().substr(0, 8)}</span>
                    <span className='commit-close' onClick={this.close}>x</span>
                </div>
                <div className='mt-10' style={{paddingLeft: 5}}>Message: </div>
                <div className='commit-info'>
                    <div>
                        {commit.message()}
                    </div>
                </div>
                <div className='mt-10' style={{paddingLeft: 5}}>Author: </div>
                <div className='mt-10' style={{paddingLeft: 5}}>
                    {commit.committer().name()}{`<${commit.committer().email()}>`}
                </div>
                <div className='mt-15'>
                    <table style={{width: '100%'}} className='status-table'>
                        <thead>
                            <tr>
                                <td>Name</td>
                                <td>Modification</td>
                            </tr>
                        </thead>
                        <tbody>
                            {this.renderFiles(patches)}
                        </tbody>
                    </table>
                </div>
            </div>;
        } else {
            return null;
        }
    }
}

export default CommitInfo;
