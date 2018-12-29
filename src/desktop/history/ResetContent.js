import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import 'r-cmui/components/RadioGroup';

class ResetContent extends React.Component {
    displayName = 'ResetContent';

    state = {
        commitId: ''
    }

    getValue () {
        return this.form.getFormParams();
    }

    setCommitId (id) {
        this.setState({commitId: id});
    }

    render () {
        return <Form ref={f => this.form = f}>
            <div className='mb-15'>Reset to commit {this.state.commitId.substr(0, 8)}</div>
            <FormControl type='radio' layout='stack' name='type' value='soft' data={[
                {id: 'soft', text: 'Soft: don\'t change the index and working tree'},
                {id: 'mixed', text: 'Mixed: make the index identical to the selected commit'},
                {id: 'hard', text: 'Hard: set the index and working tree to the state of the selected commit\n'}
            ]}/>
        </Form>;
    }
}

export default ResetContent;
