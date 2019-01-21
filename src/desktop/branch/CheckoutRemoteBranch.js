import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/Input';
import 'r-cmui/components/CheckBoxGroup';

class CheckoutRemoteBranch extends React.Component {
    displayName = 'CheckoutRemoteBranch';

    state = {
        data: {}
    }

    setData (data) {
        // this.form.setData(data);
        data.isTrack = '1';
        this.setState({data});
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        const {data} = this.state;
        return <div>
            <div>
                Be careful when checking out a commit instead of a local<br/>
                branch: commits on top of a commit can get lost easily.
            </div>
            <div className='mt-20'>
                <Form labelWidth={120} ref={f => this.form = f} data={data}>
                    <div>
                        <FormControl type='text' name='name' label='Local Branch: ' value={''} required/>
                    </div>
                    <div>
                        <FormControl type='checkbox' name='isTrack' label='&nbsp;' value='1' data={[
                            {id: '1', text: `Track remote branch ${data.remote}/${data.name}`}
                        ]}/>
                    </div>
                </Form>
            </div>
        </div>;
    }
}

export default CheckoutRemoteBranch;
