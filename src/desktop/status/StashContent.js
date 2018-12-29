import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import 'r-cmui/components/TextArea';

class StashContent extends React.Component {
    displayName = 'StashContent';

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        return <Form ref={f => this.form = f}>
            <div className='mb-5'>input stash Messages：</div>
            <FormControl name='message' label='' type='textarea' width={300} height={100} required/>
        </Form>;
    }
}

export default StashContent;
