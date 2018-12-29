import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Table from 'r-cmui/components/Table';
import 'r-cmui/components/TextArea';

class CommitContent extends React.Component {
    displayName = 'CommitContent';

    columns = [
        {name: 'file', text: 'File Name'}
    ]

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    setFiles (files) {
        const data = files.map(item => {
            return {file: item};
        });
        this.table.setData(data);
    }

    render () {
        return <Form ref={f => this.form = f}>
            <div style={{width: 500, height: 150, border: '1px solid #ddd', borderRadius: 4, overflow: 'auto'}}>
                <Table bordered={false} columns={this.columns} data={[]} ref={f => this.table = f}></Table>
            </div>
            <div className='mb-5'>commit message:</div>
            <FormControl type='textarea' name='message' width={500} height={150} required value={this.props.template}/>
        </Form>;
    }
}

export default CommitContent;
