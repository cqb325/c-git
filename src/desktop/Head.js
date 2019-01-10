import React from 'react';
import Layout from 'r-cmui/components/Layout';
const {Header} = Layout;
import logo from '../images/logo.png';
import min from '../images/min.svg';
import max from '../images/max.svg';
import close from '../images/close.svg';
const {ipcRenderer} = require('electron');

class Head extends React.Component {
    displayName = 'Head';

    onMinimize = () => {
        ipcRenderer.send('win-minimize');
    }

    onMaximize = () => {
        ipcRenderer.send('win-maximize');
    }

    onClose = () => {
        ipcRenderer.send('win-close');
    }

    render () {
        return <Header style={{height: 35, padding: '0 0 0 15px', lineHeight: '35px', background: '#333333', userSelect: 'none', '-webkitAppRegion': 'drag'}}>
            <img style={{width: 22, height: 22, marginTop: 6.5}} src={logo}/>
            <span style={{position: 'relative', top: -4.5, height: 35, marginLeft: 15, textShadow: '0 0 5px #9a8585'}}>C-GIT</span>

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
