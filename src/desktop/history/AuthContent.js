import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/Input';

class AuthContent extends React.Component {
    displayName = 'AuthContent';

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        return <Form ref={f => this.form = f} labelWidth={90}>
            <div>
                <FormControl type='text' name='username' label='UserName: ' required itemStyle={{width: 400}}/>
            </div>
            <div>
                <FormControl type='password' name='password' label='Password: ' required itemStyle={{width: 400}}/>
            </div>
        </Form>;
    }
}

export default AuthContent;
