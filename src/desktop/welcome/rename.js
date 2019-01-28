import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import 'r-cmui/components/Input';

class Comp extends React.Component {
    displayName = 'Comp';

    setData (name) {
        this.orign = name;
        this.name.setValue(name);
    }

    isValid () {
        return this.form.isValid();
    }

    isChanged () {
        const params = this.form.getFormParams();
        return params.name !== this.orign;
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        return <Form labelWidth={80} ref={f => this.form = f}>
            <FormControl itemStyle={{width: 300}} ref={f => this.name = f} type='text' name='name' label='Name: ' required/>
        </Form>;
    }
}

export default Comp;
