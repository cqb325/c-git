import React from 'react';
import Layout from 'r-cmui/components/Layout';
import ResizeContent from 'r-cmui/components/Layout/ResizeContent';
import FileTree from './FileTree';
import Branches from './Branches';
import Status from './Status';
import History from './History';
import CommitInfo from './CommitInfo';
import DiffContent from './DiffContent';
const {Content} = Layout;

import './style.less';

import { inject, observer } from 'mobx-react';

@inject('repo')
@observer
class Desktop extends React.Component {
    displayName = 'Desktop';

    branchesTimer = null;
    historyTimer = null;
    treeTimer = null;
    statusTimer = null;

    componentWillUnmount () {
        this.props.repo.closeWatch();
    }

    componentDidMount () {
        this.props.repo.setCurrentRepo('E:/ideaWorkspaces/ops-portal', (event, path) => {
            console.log(event, path);
            if (path.indexOf('.git\\') !== -1) {
                // stash change
                if (path.indexOf('.git\\refs\\stash') !== -1 || path.indexOf('.git\\HEAD')) {
                    if (this.branchesTimer) {
                        clearTimeout(this.branchesTimer);
                        this.branchesTimer = null;
                    }
                    this.branchesTimer = setTimeout(() => {
                        this.branchesTimer = null;
                        this.branches.refresh();
                    }, 300);
                }
                if (path.indexOf('.git\\logs\\HEAD') !== -1) {
                    if (this.historyTimer) {
                        clearTimeout(this.historyTimer);
                        this.historyTimer = null;
                    }
                    this.historyTimer = setTimeout(() => {
                        this.historyTimer = null;
                        this.history.refresh();
                    }, 1000);
                }
            } else {
                // 创建删除目录
                if (event === 'unlinkDir' || event === 'addDir' || path.indexOf('.gitignore') !== -1) {
                    if (this.treeTimer) {
                        clearTimeout(this.treeTimer);
                        this.treeTimer = null;
                    }
                    this.treeTimer = setTimeout(() => {
                        this.treeTimer = null;
                        this.fileTree.refresh();
                    }, 300);
                }
                if (this.statusTimer) {
                    clearTimeout(this.statusTimer);
                    this.statusTimer = null;
                }
                this.statusTimer = setTimeout(() => {
                    this.statusTimer = null;
                    this.status.refresh();
                }, 300);
            }
        });
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

    render () {
        console.log('render index...');
        const {cwd, historyFile} = this.props.repo;
        if (!cwd) {
            return null;
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
                        <History bind={this.bindHistory.bind(this)} historyFile={historyFile}/>
                    </ResizeContent>
                    <ResizeContent handlerSize={3} width={300} minWidth={300} direction='vertical' align='left' className='right-sider'>
                        <Status bind={this.bindStatus.bind(this)} onCommit={this.onCommit}/>
                        <CommitInfo/>
                    </ResizeContent>
                </Layout>
            </Content>
        </Layout>;
    }
}

export default Desktop;
