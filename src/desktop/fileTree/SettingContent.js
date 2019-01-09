import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

class SettingContent extends React.Component {
    displayName = 'SettingContent';

    state = {
        data: null
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    /**
     * 是否存在修改
     */
    isChange () {
        const data = this.state.data;
        const formData = this.getValue();
        for (const key in data) {
            if (data[key] !== formData[key]) {
                return true;
            }
        }
        return false;
    }

    setData (data) {
        const keys = Object.keys(data).filter(key => {
            return key.indexOf('remote') !== -1;
        });
        let url = '';
        if (keys && keys.length) {
            const remote = data[keys[0]];
            url = remote.url;
        }

        const map = {
            'user.name': data.user ? data.user.name : '',
            'user.email': data.user ? data.user.email : '',
            'username': data.author.username,
            'password': data.author.password,
            url
        };
        
        this.setState({
            data: map
        });
    }

    render () {
        return <Form labelWidth={100} data={this.state.data} ref={f => this.form = f}>
            <div>
                <FormControl type='text' name='url' label='URL:' itemStyle={{width: 350}} disabled/>
            </div>
            <div>
                <FormControl type='text' name='user.name' label='Commit User:' itemStyle={{width: 350}} required/>
            </div>
            <div>
                <FormControl type='text' name='user.email' label='Commit Email:' itemStyle={{width: 350}} required/>
            </div>
            <div>
                <FormControl type='text' name='username' label='UserName:' itemStyle={{width: 350}} required/>
            </div>
            <div>
                <FormControl type='password' name='password' label='Password:' itemStyle={{width: 350}} required/>
            </div>
        </Form>;
    }
}

export default SettingContent;
