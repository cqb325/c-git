import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Button from 'r-cmui/components/Button';
import utils from '../../utils/utils';
import 'r-cmui/components/Input';
import 'r-cmui/components/Select';

const {remote} = require('electron');
const { dialog } = remote;

class CreateContent extends React.Component {
    displayName = 'CreateContent';

    componentDidMount () {
        const types = utils.fetchIgnoreTypes();
        this.types.getReference().setData(types);
    }

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
        return <Form labelWidth={80} ref={f => this.form = f}>
            <div>
                <FormControl itemStyle={{width: 300}} ref={f => this.dir = f} type='text' name='dir' label='Dir: ' required suffix={<Button theme='primary' onClick={this.selectFile}>Dir</Button>}/>
            </div>
            <div>
                <FormControl itemStyle={{width: 300}} ref={f => this.types = f} filter type='select' name='ingoreTemplate' label='ignore Temp: '  />
            </div>
        </Form>;
    }
}

export default CreateContent;
