import React from 'react';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';
import Button from 'r-cmui/components/Button';
import GitClient from '../../utils/git';

class StartFeatureContent extends React.Component {
    displayName = 'StartFeatureContent';

    async componentDidMount () {
        const cwd = this.props.cwd;
        this.client = new GitClient(cwd);
        const hotfixs = await this.client.getHotfixs();
        let index = 1;
        let name = `${index}.0`;
        while (hotfixs[`${name}`]) {
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

    startFeature = async () => {
        if (this.isValid()) {
            const name = this.name.getValue();
            await this.client.startHotFix(name);
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
                Start a new Hotfix.
            </div>

            <Form className='mt-10' ref={f => this.form = f}>
                <FormControl ref={f => this.name = f} required type='text' name='name' label='HotFix Name: ' itemStyle={{width: 250}}/>
            </Form>

            <div className='text-right mt-15'>
                <Button theme='primary' className='mr-5 text-center' style={{width: 80}} 
                    onClick={this.startFeature}>Start</Button>
                <Button style={{width: 80}} onClick={this.close}>Cancel</Button>
            </div>
        </div>;
    }
}

export default StartFeatureContent;
