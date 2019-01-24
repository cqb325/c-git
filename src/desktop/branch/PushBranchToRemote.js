import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/Select';
import 'r-cmui/components/CheckBoxGroup';

class PushBranchToRemote extends React.Component {
    displayName = 'PushBranchToRemote';

    state = {
        data: null,
        selectedRemote: ''
    }

    setData (data) {
        data.remotes.forEach(item => {
            item.url = `(${item.name})${item.url}`;
        });
        this.setState({data});
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    changeRemote = (v) => {
        this.setState({
            selectedRemote: v
        });
    }

    render () {
        const {data} = this.state;
        if (!data) {
            return null;
        }
        const {name, remotes} = data;
        const remote = remotes[0];
        const remoteName = this.state.selectedRemote || remote.name;
        return <div>
            <div>
                {`push '${name}' to remote '${remoteName}'`}
            </div>
            <div className='mt-20'>
                <Form labelWidth={80} ref={f => this.form = f}>
                    <FormControl itemStyle={{width: 400}}
                        type='select' name='remote' label='Remote: '
                        data={remotes} valueField='name' textField='url'
                        value={remote.name}
                        onChange={this.changeRemote}
                    />
                </Form>
            </div>
        </div>;
    }
}

export default PushBranchToRemote;
