import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/TextArea';

class FinishFeatureContent extends React.Component {
    displayName = 'FinishFeatureContent';

    setName (name) {
        this.msg.setValue(`Finish ${name}`);
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        return <div>
            <div style={{fontWeight: 700}} className='mb-10'>
                Finish a feature
            </div>

            <div className='mt-10 mb-5'>Commit Message:</div>
            <Form ref={f => this.form = f}>
                <FormControl ref={f => this.msg = f} required type='textarea' name='message' width={450} height={120}/>
            </Form>
        </div>;
    }
}

export default FinishFeatureContent;
