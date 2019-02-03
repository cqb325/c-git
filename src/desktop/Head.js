import React from 'react';
import Layout from 'r-cmui/components/Layout';
import Menu from 'r-cmui/components/Menu';
import FontIcon from 'r-cmui/components/FontIcon';
const {Header} = Layout;
const {SubMenu} = Menu;
import logo from '../images/logo.png';
import min from '../images/min.svg';
import max from '../images/max.svg';
import close from '../images/close.svg';
import treeIcon from '../images/tree.svg';
import helpIcon from '../images/help.svg';
import startFeatureIcon from '../images/start.svg';
import startReleaseIcon from '../images/release.svg';
import startHotfixIcon from '../images/hotfix.svg';
import aboutIcon from '../images/about.svg';
import welcomeIcon from '../images/welcome.svg';
import fileIcon from '../images/file.svg';
const {ipcRenderer} = require('electron');
const Configstore = require('configstore');
import utils from '../utils/utils';
const store = new Configstore('c-git');
import { inject, observer } from 'mobx-react';

@inject('repo')
@observer
class Head extends React.Component {
    displayName = 'Head';

    constructor (props) {
        super(props);
        this.state = {
            recents: this.getRecents()
        };
    }

    onMinimize = () => {
        ipcRenderer.send('win-minimize');
    }

    onMaximize = () => {
        ipcRenderer.send('win-maximize');
    }

    onClose = () => {
        ipcRenderer.send('win-close');
    }

    onSelect = (item) => {
        if (item.props.command) {
            if (this.props.onCommand) {
                this.props.onCommand(item.props.command, item.props.data);
            }
        }
        item.unSelect();
    }

    getRecents () {
        const items = [];
        let index = 1;
        for (const name in store.all) {
            const item = store.all[name];
            if (index > 10) {
                break;
            }
            items.push({
                id: `${item.name}_${item.dir}`,
                lastOpenTime: item.lastOpenTime,
                label: item.dir,
                data: item
            });
            index ++;
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

        return items;
    }

    renderRecentRepos () {
        const items = this.state.recents;
        return items.map(item => {
            return <Menu.Item key={item.id} command='open_repo' data={item.data}>{item.label}</Menu.Item>;
        });
    }

    updateRecents () {
        const items = this.getRecents();
        this.setState({
            recents: items
        });
    }

    componentDidMount () {
        this.props.bind(this);
    }

    render () {
        if (!this.props.repo.cwd) {
            return null;
        }
        console.log('render head...');
        const hasFlowBranches = utils.hasFlowBranches(this.props.repo.cwd);
        return <Header style={{height: 35, padding: '0 0 0 15px', lineHeight: '35px', background: '#333333', userSelect: 'none', '-webkitAppRegion': 'drag', textAlign: 'center'}}>
            <img style={{width: 22, height: 22, marginTop: 6.5}} src={logo} className='pull-left'/>
            <Menu className='pull-left' theme='dark' ref={f => this.menu = f}
                style={{'-webkitAppRegion': 'no-drag', display: 'inline-block', marginLeft: 15, textAlign: 'left'}}
                layout='horizontal' onSelect={this.onSelect}>
                <SubMenu title={<span><img src={fileIcon} style={{marginRight: 5, position: 'relative', top: 2}}/>file</span>}>
                    <Menu.Item command='open'><FontIcon icon='folder-open-o' color='#1CA538'/>Open</Menu.Item>
                    <Menu.Item command='create'><FontIcon icon='plus-square-o' color='#1CA538'/>Create</Menu.Item>
                    <Menu.Item command='clone'><FontIcon icon='clone' color='#1CA538'/>Clone</Menu.Item>
                    <SubMenu title={<span><FontIcon icon='list' color='#1CA538'/>Open Recent</span>}>
                        {this.renderRecentRepos()}
                    </SubMenu>
                    <Menu.Divider/>
                    <Menu.Item command='welcome'><img src={welcomeIcon} style={{marginRight: 5, position: 'relative', top: 3}}/>Welcome</Menu.Item>
                    <Menu.Item command='exit'><FontIcon icon='stop-circle-o' color='#1CA538'/>Exit</Menu.Item>
                </SubMenu>
                <SubMenu title={<span><img src={treeIcon} style={{marginRight: 5, position: 'relative', top: 2}}/>flow</span>}>
                    {
                        hasFlowBranches
                            ? <Menu.Item command='flow-start-feature'><img src={startFeatureIcon} style={{position: 'relative', top: 2, left: -1, marginRight: 2}}/>Start Feature</Menu.Item>
                            : null
                    }
                    {
                        hasFlowBranches
                            ? <Menu.Item command='flow-start-release'><img src={startReleaseIcon} style={{width: 12, position: 'relative', top: 2, left: -1, marginRight: 2}}/>Start Release</Menu.Item>
                            : null
                    }
                    {
                        hasFlowBranches
                            ? <Menu.Item command='flow-start-hotfix'><img src={startHotfixIcon} style={{width: 12, position: 'relative', top: 2, left: -1, marginRight: 2}}/>Start Hotfix</Menu.Item>
                            : null
                    }
                    <Menu.Item command='flow-config'><FontIcon icon='cog' color='#1CA538'/>Config</Menu.Item>
                </SubMenu>
                <SubMenu title={<span><img src={helpIcon} style={{marginRight: 5, position: 'relative', top: 3}}/>help</span>}>
                    <Menu.Item command='about'><img src={aboutIcon} style={{position: 'relative', top: 2, left: -1, marginRight: 2}}/>About</Menu.Item>
                </SubMenu>
            </Menu>
            <span style={{height: 35, marginLeft: 15, textShadow: '0 0 5px #9a8585'}}>C-GIT</span>
            <ul className='pull-right frame-tools'>
                <li className='frame-tool-item' title='minimize' onClick={this.onMinimize}>
                    <img src={min}/>
                </li>
                <li className='frame-tool-item' title='maximize' onClick={this.onMaximize}>
                    <img src={max}/>
                </li>
                <li className='frame-tool-item frame-tool-close' title='close' onClick={this.onClose}>
                    <img src={close}/>
                </li>
            </ul>
        </Header>;
    }
}

export default Head;
