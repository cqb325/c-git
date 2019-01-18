import React from 'react';
import Layout from 'r-cmui/components/Layout';
import Progress from 'r-cmui/components/Progress';
const {ipcRenderer} = require('electron');
const {Footer} = Layout;

class Foot extends React.Component {
    displayName = 'Foot';

    componentDidMount () {
        ipcRenderer.on('progress_res', this.updateProgress);
    }

    componentWillUnmount () {
        ipcRenderer.removeListener('progress_res', this.updateProgress);
    }

    updateProgress = (event, percent) => {
        this.progress.setValue(percent);
        if (percent === 100) {
            window.setTimeout(() => {
                this.progress.setValue(0);
            }, 500);
        }
    }

    render () {
        return <Footer style={{height: 25, padding: 0}}>
            <span className='pull-right progress-wrap'>
                <Progress ref={f => this.progress = f} active showPercent={false} value={0} strokeWidth={15}/>
            </span>
        </Footer>;
    }
}

export default Foot;
