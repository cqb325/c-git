import { RouterStore } from 'mobx-react-router';
const routingStore = new RouterStore();
import Repo from './repo';
import FileTree from './FileTree';
import Branches from './Branches';
import Status from './Status';
import History from './History';
import Commit from './Commit';

const stores = {
    routing: routingStore,
    repo: new Repo(),
    fileTree: new FileTree(),
    status: new Status(),
    history: new History(),
    commit: new Commit(),
    branches: new Branches()
};


export default stores;
