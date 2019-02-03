import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Button from 'r-cmui/components/Button';
import GitClient from '../../utils/git';

class StartReleaseContent extends React.Component {
    displayName = 'StartReleaseContent';

    async componentDidMount () {
        const cwd = this.props.cwd;
        this.client = new GitClient(cwd);
        const releases = await this.client.getReleases();
        let index = 1;
        let name = `${index}.0`;
        while (releases[`release${name}`]) {
            index++;
            name = `${index}.0`;
        }
        this.name.setValue(name);
    }

    isValid () {
        return this.form.isValid();
    }

    getValue () {
        return this.form.getFormParams();
    }

    startRelease = async () => {
        if (this.isValid()) {
            const version = this.name.getValue();
            await this.client.startRelease(version);
            this.close();
        }
    }

    close = () => {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render () {
        return <div>
            <div style={{fontWeight: 700}} className='mb-10'>
                Start a new Release.
            </div>

            <Form className='mt-10' ref={f => this.form = f}>
                <FormControl ref={f => this.name = f} required type='text' name='name' label='Release Version: ' itemStyle={{width: 250}}/>
            </Form>

            <div className='text-right mt-15'>
                <Button theme='primary' className='mr-5 text-center' style={{width: 80}} 
                    onClick={this.startRelease}>Start</Button>
                <Button style={{width: 80}} onClick={this.close}>Cancel</Button>
            </div>
        </div>;
    }
}

export default StartReleaseContent;
