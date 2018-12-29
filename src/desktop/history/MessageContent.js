import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/TextArea';

class Comp extends React.Component {
    displayName = 'Comp';

    state = {
        message: null
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    setMessage (message) {
        this.setState({message});
    }

    render () {
        return <Form ref={f => this.form = f}>
            <div className='mb-5'>edit message:</div>
            <FormControl type='textarea' name='message' value={this.state.message} width={400} height={150} required/>
        </Form>;
    }
}

export default Comp;
