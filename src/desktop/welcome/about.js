import React from 'react';
import logo from '../../images/logo.png';
import electron from '../../images/electron.svg';
import nodegit from '../../images/nodegit.svg';

class AboutContent extends React.Component {
    displayName = 'AboutContent';

    render () {
        return <div>
            <div className='mt-45 text-center' style={{width: 500}}>
                <img src={logo} style={{width: 64}}/>
                <div>C-GIT (v0.1.0)</div>
                <div>copyright <span style={{fontSize: 18, verticalAlign: 'top'}}>&copy;</span> cqb325@163.com</div>
            </div>
            <div className='mb-30 mt-30 text-center'>
                <span>
                    <img src={electron} style={{height: 50}}/>
                </span>
                <span className='ml-10'>
                    <img src={nodegit} style={{height: 44}}/>
                </span>
            </div>
        </div>;
    }
}

export default AboutContent;
