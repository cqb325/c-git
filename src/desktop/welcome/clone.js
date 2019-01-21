import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Button from 'r-cmui/components/Button';
import 'r-cmui/components/Input';

const {remote} = require('electron');
const { dialog } = remote;

class CloneContent extends React.Component {
    displayName = 'CloneContent';

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    selectFile = () => {
        dialog.showOpenDialog({
            title: '选择仓库目录',
            properties: ['openDirectory']
        }, async (filePaths) => {
            if (filePaths) {
                this.dir.getReference().setValue(filePaths[0]);
            } else {
                this.dir.getReference().setValue('');
            }
        });
    }

    render () {
        return <Form labelWidth={145} ref={f => this.form = f}>
            <div>
                <FormControl itemStyle={{width: 400}} ref={f => this.url = f} type='text' name='url' label='Repository URL: ' required/>
            </div>
            <div>
                <FormControl itemStyle={{width: 400}} ref={f => this.dir = f} type='text' name='dir' label='Dir: ' required suffix={<Button theme='primary' onClick={this.selectFile}>Dir</Button>}/>
            </div>
        </Form>;
    }
}

export default CloneContent;
