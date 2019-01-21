import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

import 'r-cmui/components/Input';

class PropertyContent extends React.Component {
    displayName = 'PropertyContent';

    state = {
        data: null
    }

    setData (data) {
        this.setState({data});
    }

    /**
     * 是否有值
     */
    isValid () {
        return this.form.isValid();
    }

    /**
     * 是否改变了url
     */
    isChanged () {
        const data = this.form.getFormParams();
        return data.url !== this.state.data.url;
    }

    getValue () {
        return this.form.getFormParams();
    }

    render () {
        const {data} = this.state;
        if (!data) {
            return null;
        }
        return <div>
            <div style={{paddingLeft: 15}}>
                Configure remote properties<br/>
                You can change the URL property for the remote.
            </div>
            <div className='mt-20'>
                <Form labelWidth={56} ref={f => this.form = f}>
                    <FormControl itemStyle={{width: 400}}
                        type='text' name='url' label='URL: '
                        value={data.url} required
                    />
                </Form>
            </div>
        </div>;
    }
}

export default PropertyContent;
