import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import {toJS} from 'mobx';

import 'r-cmui/components/Input';
import 'r-cmui/components/Select';

class Comp extends React.Component {
    displayName = 'Comp';

    state = {
        name: ''
    }

    isValid () {
        return this.form.isValid();
    }

    setName (name) {
        this.setState({name});
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        const {data} = this.props;
        const remotes = toJS(data).remotes;

        let refs = [];
        for (const name in remotes) {
            const remote = remotes[name];
            refs = refs.concat(remote);
        }
        
        refs.forEach(item => {
            item.text = `${item.remote}/${item.name}`;
        });
        
        return <Form ref={f => this.form = f} labelWidth={80}>
            <div>
                <FormControl type='select' value={this.state.name} name='remote' label='Remote: ' data={refs} valueField='text' required/>
            </div>
        </Form>;
    }
}

export default Comp;
