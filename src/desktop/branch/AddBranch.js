import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import {toJS} from 'mobx';

import 'r-cmui/components/Input';
import 'r-cmui/components/Select';

class Comp extends React.Component {
    displayName = 'Comp';

    isValid () {
        return this.form.isValid();
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
                <FormControl type='text' name='name' label='Name: ' required/>
            </div>
            <div>
                <FormControl type='select' name='remote' label='Remote: ' data={refs} valueField='text' required/>
            </div>
        </Form>;
    }
}

export default Comp;
