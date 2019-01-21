import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Table from 'r-cmui/components/Table';
import 'r-cmui/components/Input';
import 'r-cmui/components/TextArea';

class CommitContent extends React.Component {
    displayName = 'CommitContent';

    state = {
        lastLength: 72 - (this.props.template ? this.props.template.length : 0)
    }

    columns = [
        {name: 'file', text: 'File Name'}
    ]

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        const data = this.form.getFormParams();
        if (data.description) {
            data.message = `${data.summary}\n\n${data.description}`;
        } else {
            data.message = data.summary;
        }
        return data;
    }

    setFiles (files) {
        const data = files.map(item => {
            return {file: item};
        });
        this.table.setData(data);
    }

    onChangeSummary = (v) => {
        this.setState({
            lastLength: 72 - v.target.value.length
        });
    }

    render () {
        return <Form ref={f => this.form = f}>
            <div style={{width: 500, height: 150, border: '1px solid #ddd', borderRadius: 4, overflow: 'auto'}}>
                <Table bordered={false} columns={this.columns} data={[]} ref={f => this.table = f}></Table>
            </div>
            <div className='mb-5'>commit message:</div>
            <div>
                <FormControl type='text' maxLength={72} name='summary' placeholder='Summary' itemStyle={{width: 500}} required value={this.props.template}
                    suffix={this.state.lastLength} onInput={this.onChangeSummary}/>
            </div>
            <div>
                <FormControl type='textarea' name='description' width={500} height={100} placeholder='Description'/>
            </div>
        </Form>;
    }
}

export default CommitContent;
