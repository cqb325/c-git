import React from 'react';
import logo from '../../images/logo.png';

class AboutContent extends React.Component {
    displayName = 'AboutContent';

    render () {
        return <div>
            <div className='mt-45 text-center' style={{width: 500}}>
                <img src={logo} style={{width: 64}}/>
                <div>C-GIT (v0.1.0)</div>
                <div>copyright &copy; cqb325@163.com</div>
            </div>
        </div>;
    }
}

export default AboutContent;
