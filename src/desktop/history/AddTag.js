import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/Input';
import 'r-cmui/components/TextArea';

class Comp extends React.Component {
    displayName = 'Comp';

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        return <Form ref={f => this.form = f} labelWidth={80}>
            <div>
                <FormControl type='text' name='name' label='Tag: ' required itemStyle={{width: 400}}/>
            </div>
            <div>
                <FormControl type='textarea' name='message' label='Message: ' required
                    width={400} height={150}/>
            </div>
        </Form>;
    }
}

export default Comp;
