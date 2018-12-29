import React from 'react';
import { Diff2Html } from 'diff2html';
import 'diff2html/dist/diff2html.min.css';
import './status/github.min.css';

import { inject, observer } from 'mobx-react';

@inject('status')
@inject('commit')
@observer
class DiffContent extends React.Component {
    displayName = 'DiffContent';

    closeDiff = () => {
        const {diffText} = this.props.status;
        const commitDiffText = this.props.commit.diffText;
        if (diffText) {
            this.props.status.setDiffText('');
        }
        if (commitDiffText) {
            this.props.commit.setDiffText('');
        }
    }

    render () {
        const {diffText} = this.props.status;
        const commitDiffText = this.props.commit.diffText;
        if (!diffText && !commitDiffText) {
            return null;
        }
        let html;
        if (diffText || commitDiffText) {
            html = Diff2Html.getPrettyHtml(diffText || commitDiffText, {
                inputFormat: 'diff',
                showFiles: false,
                matching: 'lines'
            });
        }
        
        return <div className='diff-box'>
            <div className='diff-title'>
                Diff Files
                <span className='pull-right diff-close' onClick={this.closeDiff}>x</span>
            </div>
            <div className='diff-body'>
                <div dangerouslySetInnerHTML={{__html: html}}></div>
            </div>
        </div>;
    }
}

export default DiffContent;
