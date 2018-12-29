import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
const path = require('path');
import 'r-cmui/components/RadioGroup';
import 'r-cmui/components/Input';

class IgnoreContent extends React.Component {
    displayName = 'IgnoreContent';

    state = {
        type: '2'
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        const params = this.form.getFormParams();
        if (params.type === '1') {
            params.rule = `${this.state.filePath}`;
        }
        return params;
    }

    changeType = (v) => {
        this.setState({type: v});
    }

    setPath (filePath) {
        this.setState({
            filePath
        });
    }

    render () {
        let extName = '';
        if (this.state.filePath) {
            extName = path.extname(this.state.filePath);
        }
        return <Form layout='inline' ref={f => this.form = f}>
            <FormControl value={this.state.type} name='type' type='radio' layout='stack' data={[
                {id: '1', text: 'ignore explicitly (e.g. \'MakeFile\')'},
                {id: '2', text: 'ignore as pattern(e.g. \'*.obj\')：'}
            ]} required onChange={this.changeType}/>
            <FormControl name='rule' label='' type='text' required disabled={this.state.type === '1'} value={`*${extName}`}/>
        </Form>;
    }
}

export default IgnoreContent;
