import React from 'react';
import GitGraph from '../components/gitGraph';
import {toJS} from 'mobx';

class Grapgh extends React.Component {
    displayName = 'Grapgh';

    componentDidMount () {
        
    }

    renderGraph () {
        if (this.rendered) {
            return;
        }
        const myTemplateConfig = {
            colors: ['#80729F', '#D78DBF', '#8ECEE5', '#F7A64A', '#ADBD36', '#CC4C46', '#96C55E'], // branches colors, 1 per column
            branch: {
                lineWidth: 3,
                spacingX: 20
            },
            commit: {
                spacingY: -30,
                dot: {
                    size: 6,
                    strokeWidth: 2
                },
                message: {
                    display: false,
                    displayAuthor: false,
                    displayBranch: false,
                    displayHash: false
                },
                shouldDisplayTooltipsInCompactMode: false
            }
        };
        const myTemplate = new GitGraph.Template(myTemplateConfig);
        const config = {
            elementId: 'gitGraph',
            template: myTemplate,
            marginX: 120,
            onClick: (commit) => {
                console.log(commit.sha1);
            },
            orientation: 'vertical-reverse'
        };
        if (!this.graph) {
            this.graph = new GitGraph(config);
        } else {
            this.graph.destroy();
        }

        this.graph.branch('master');
        const data = toJS(this.props.data);

        const commits = data.commits;
        console.log(commits.length);
        this.buildData(commits);

        this.commits['1c0cf35a6501b7a4d841eed4078f2f560bdda0c8'].parents().forEach(parent => {
            console.log(parent.tostrS());
        });
        

        for (let i = commits.length - 1; i >= 0; i--) {
            const last = commits[i + 1];
            this.commit(last, commits[i]);
        }

        this.graph.render();
        console.log(`graph length: ${this.graph.commits.length}`);
        this.rendered = true;
    }

    /**
     * 获取最小row的parent
     * @param {*} item 
     */
    getParent (item) {
        const parents = item.parents();
        let parent;
        let min = 1000000;
        parents.forEach(oid => {
            const id = oid.tostrS();
            const p = this.commits[id];
            if (p && p.row < min) {
                min = p.row;
                parent = p;
            }
        });
        return parent;
    }

    isParent (sha, item) {
        const parents = item.parents();
        if (!parents || !parents.length) {
            return false;
        }
        let has = false;
        parents.forEach(parent => {
            if (parent.tostrS() === sha) {
                has = true;
                return has;
            }
        });
        return has;
    }

    commit (last, item) {
        let branch = this.graph.getBranch(item.col);
        let parentBranch = null;

        if (!last) {
            if (!branch) {
                branch = this.graph.branch({
                    column: item.col
                });
            }
            branch.commit({
                sha1: item.sha(),
                commit: item
            });
            this.shouldCreateNewBranch(item);
            return;
        }
        // 不存在则创建新分支并提交
        if (!branch) {
            const parent = this.getParent(item);
            if (!parent) {
                branch = this.graph.branch({
                    column: item.col
                });
            } else {
                const parentCommit = this.graph.getCommit(parent.sha());
                parentBranch = parentCommit.branch;
                branch = parentBranch.branch({
                    column: item.col
                });
            }

            branch.commit({
                sha1: item.sha(),
                commit: item
            });

            this.shouldCreateNewBranch(item);
        } else {
            // 存在branch 是merge还是commit？
            // 看上一次提交跟此次提交的col是否一致
            this.isSameColMergeOrCommit(last, item);
            this.isCrossCommitOrMerge(last, item);
        }
    }

    isSameColMergeOrCommit (last, item) {
        const parentCommit = this.graph.getCommit(last.sha());
        let parentBranch;
        // 没有提交  默认主分支
        if (!parentCommit) {
            parentBranch = this.graph.getBranch(0);
        } else {
            parentBranch = parentCommit.branch;
        }
        if (last.col === item.col) {
            // merge过来的
            const parentIds = this.getParentIds(item);
            if (parentIds.length > 1) {
                parentIds.forEach(id => {
                    if (id !== last.sha()) {
                        const mergeCommit = this.graph.getCommit(id);
                        if (mergeCommit) {
                            const toBranch = this.graph.getBranch(item.col);
                            mergeCommit.branch.merge(toBranch, {
                                sha1: item.sha(),
                                commit: item
                            });
                            this.canBranchDestroyed(mergeCommit.branch, this.commits[id]);
                            this.shouldCreateNewBranch(item);
                        }
                    }
                });
            } else {
                parentBranch.commit({
                    sha1: item.sha(),
                    commit: item
                });
                this.shouldCreateNewBranch(item);
            }
        }
    }

    shouldCreateNewBranch (item) {
        if (item.children && item.children.length > 1) {
            item.children.forEach((child, index) => {
                if (item.sha() === 'f684feca75efa3e355083bef72d070193dde03bb') {
                    console.log(child.sha(), child.col);
                }
                if (child.col > item.col) {
                    this.createChildBranch(item, child, index);
                }
            });
        }
    }

    createChildBranch (item, child, index) {
        const fromBranch = this.graph.getBranch(item.col);
        const childBranch = this.graph.getBranch(child.col);
        if (!childBranch || childBranch.isDestroyed) {
            fromBranch.branch({
                column: child.col,
                name: child.sha()
            });
        } else {
            // const start = item.row;
            // const end = child.row;
            // if (child.col !== item.col && start - end > 1) {
            //     let hasParent = false;
            //     for (let i = start; i < end; i++) {
            //         const isParent = this.isParent(this.commitList[i].sha(), child);
            //         if (isParent) {
            //             hasParent = true;
            //         }
            //     }
            //     if (!hasParent) {
            //         for (let i = index; i >= 0; i--) {
            //             child.col++;
            //         }
            //         this.createChildBranch(item, child, index);
            //     }
            // }
        }
    }

    /**
     * 当前branch是不是可以销毁
     * 该commit的所有孩子节点的col有跟当前的branch相同的column则不能销毁  否则需要销毁
     * @param {*} branch 
     * @param {*} item 
     */
    canBranchDestroyed (branch, item) {
        let has = false;
        if (!item.children) {
            branch.isDestroyed = true;
            return;
        }
        item.children.forEach(child => {
            if (branch.column === child.col) {
                has = true;
            }
        });
        if (!has) {
            branch.isDestroyed = true;
        }
    }

    isCrossCommitOrMerge (last, item) {
        let parentCommit = this.graph.getCommit(last.sha());
        let parentBranch;
        // 没有提交  默认主分支
        if (!parentCommit) {
            parentBranch = this.graph.getBranch(0);
        } else {
            parentBranch = parentCommit.branch;
        }
        if (last.col !== item.col) {
            const isParent = this.isParent(last.sha(), item);
            // 是父节点并不是同一个col则是merge
            if (isParent) {
                let branch = this.graph.getBranch(item.col);
                if (branch.isDestroyed) {
                    branch = parentBranch.branch({
                        column: item.col
                    });
                    branch.commit({
                        sha1: item.sha(),
                        commit: item
                    });
                    this.canBranchDestroyed(parentBranch, last);
                    this.shouldCreateNewBranch(item);
                } else {
                    parentBranch.merge(branch, {
                        sha1: item.sha(),
                        commit: item
                    });
                    const prevCommit = parentBranch.commits.slice(-1)[0];
                    const prevItem = this.commits[prevCommit.sha1];
                    this.canBranchDestroyed(parentBranch, prevItem);
                    this.shouldCreateNewBranch(item);
                }
            } else {
                // commit
                let branch = this.graph.getBranch(item.col);
                if (branch.isDestroyed) {
                    // 新建分支
                    const parent = this.getParent(item);
                    if (!parent) {
                        branch = this.graph.orphanBranch({
                            column: item.col
                        });
                    } else {
                        parentCommit = this.graph.getCommit(parent.sha());
                        if (!parentCommit) {
                            branch = this.graph.branch({
                                column: item.col
                            });
                        } else {
                            branch = parentCommit.branch.branch({
                                column: item.col
                            });
                        }
                    }
                    branch.commit({
                        sha1: item.sha(),
                        commit: item
                    });
                    this.shouldCreateNewBranch(item);
                } else {
                    // merge过来的
                    const parentIds = this.getParentIds(item);
                    if (parentIds.length > 1) {
                        parentIds.forEach(id => {
                            if (id !== last.sha()) {
                                const mergeCommit = this.graph.getCommit(id);
                                if (mergeCommit) {
                                    const toBranch = this.graph.getBranch(item.col);
                                    mergeCommit.branch.merge(toBranch, {
                                        sha1: item.sha(),
                                        commit: item
                                    });
                                    this.canBranchDestroyed(mergeCommit.branch, this.commits[id]);
                                    this.shouldCreateNewBranch(item);
                                }
                            }
                        });
                    } else {
                        branch.commit({
                            sha1: item.sha(),
                            commit: item
                        });
                        this.shouldCreateNewBranch(item);
                    }
                }
            }
        }
    }

    getParentIds (item) {
        const arr = [];
        item.parents().forEach(oid => {
            if (this.commits[oid.tostrS()]) {
                arr.push(oid.tostrS());
            }
        });
        return arr;
    }

    buildData (data) {
        this.commits = {};
        this.commitList = data;
        data.forEach((item, index) => {
            this.commits[item.sha()] = item;
            item.sha1 = item.sha();
            item.col = 0;
            item.row = index;
        });

        data.forEach(item => {
            if (item.parentcount()) {
                const parents = item.parents();
                parents.forEach(parentId => {
                    const id = parentId.tostrS();
                    const parent = this.commits[id];
                    if (parent) {
                        if (!parent.children) {
                            parent.children = [];
                        }
                        parent.children.push(item);
                    }
                });
            }
        });

        const headCommit = data[0];
        let r = 0;
        this.d = 0;

        for (headCommit, r = 0; r < headCommit.row; r++) {
            const commit = data[r];
            commit.col++;
        }

        if (headCommit) {
            const plumb = this.plumb(headCommit);
            if (plumb) {
                for (r = plumb.row + 1; r < data.length; r++) {
                    const commit = data[r];
                    if (0 === commit.col) {
                        commit.col++;
                    }
                }
            }
        }

        for (let r = 0; r < data.length; r++) {
            this.plumb(data[r]);
        }

        for (let r = 0; r < data.length; r++) {
            const item = data[r];
            if (item.children && item.children.length > 1) {
                const colMap = {};
                for (let i = item.children.length - 1; i >= 0; i--) {
                    const child = item.children[i];
                    if (colMap[child.col]) {
                        child.col ++;
                        while (colMap[child.col]) {
                            child.col ++;
                        }
                        colMap[child.col] = true;
                    } else {
                        colMap[child.col] = true;
                    }
                }
            }
        }
    }

    plumb (n) {
        const h = this.commitList;
        if (!n.isPlumbed) {
            let u = void 0;
            let b;
            if (n.parents() && n.parents().length > 0) {
                for (let r = 0; r < n.parents().length; r++) {
                    const id = n.parents()[r].tostrS();
                    const l = this.commits[id];
                    if (l && !l.isPlumbed) {
                        let m = l.col - n.col,
                            v = l.row - n.row;
                        // if (n.sha() === 'f9e1375d30b5c5f2a389c01563094dda0bbf4582') {
                        //     console.log(m, v);
                        // }
                        if (0 === m && (m = r), m >= 0) { 
                            b = n.col + m;
                        }
                        else { b = n.col; }
                        // if (n.sha() === 'f9e1375d30b5c5f2a389c01563094dda0bbf4582') {
                        //     console.log(n.col,b);
                        // }
                        for (let f = 1; v > f; f++) {
                            const c = h[n.row + f];
                            // if (n.sha() === 'f9e1375d30b5c5f2a389c01563094dda0bbf4582') {
                            //     console.log(c.sha(), b, c.col);
                            // }
                            c && !c.isPlumbed && (c.col = b + 1, this.d = Math.max(c.col, this.d));
                            // if (c.sha() === 'f9e1375d30b5c5f2a389c01563094dda0bbf4582') {
                            //     console.log(c.sha(), b, c.col);
                            // }
                        }
                        0 == r ? u = this.plumb(l) : this.plumb(l);
                    } else { 0 == r && (u = n); }
                } } else { u = n; }
            return n.isPlumbed = !0, u;
        }
    }

    render () {
        const data = this.props.data;
        if (!data) {
            return null;
        }
        window.setTimeout(() => {
            this.renderGraph();
        }, 30);
        return <div style={{position: 'absolute', top: 15, left: 180, width: '100%', height: '100%'}} id='gitGraph'></div>;
    }
}

export default Grapgh;
