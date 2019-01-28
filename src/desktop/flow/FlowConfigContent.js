import React from 'react';
import Utils from '../../utils/utils';
import GitFlow from '../../utils/git/git-flow';
import Button from 'r-cmui/components/Button';
import Form from 'r-cmui/components/Form';
import FormControl from 'r-cmui/components/FormControl';

class FlowConfigContent extends React.Component {
    displayName = 'FlowConfigContent';

    state = {
        config: false
    }

    switchOff = () => {
        Utils.removeGitFlowConfig(this.props.cwd);
        if (this.props.onClose) {
            this.props.onClose(true);
        }
    }

    close = (update) => {
        if (this.props.onClose) {
            this.props.onClose(update);
        }
    }

    resetClose = () => {
        this.close();
        window.setTimeout(() => {
            this.setState({
                config: false
            });
        }, 300);
    }

    async componentDidMount () {
        const gitFlow = new GitFlow(this.props.cwd);
        this.gitFlow = gitFlow;
        await gitFlow.init();
        const isInitialized = await gitFlow.isInitialized();
        let params = {};
        if (!isInitialized) {
            const defaultConfig = gitFlow.getDefaultConfig();
            params = defaultConfig;
        } else {
            params = await gitFlow.getConfig();
        }
        if (params) {
            this.form.setData(params);
        }
    }

    initGitFlow = () => {
        const params = this.form.getFormParams();
        this.gitFlow.install(params);
        this.close(true);
        window.setTimeout(() => {
            this.setState({
                config: false
            });
        }, 300);
    }

    changeConfig = () => {
        this.setState({
            config: true
        }, () => {
            const defaultConfig = this.gitFlow.getDefaultConfig();
            this.form.setData(defaultConfig);
            if (this.props.onUpdate) {
                this.props.onUpdate();
            }
        });
    }

    render () {
        const hasFlow = Utils.hasFlowBranches(this.props.cwd);
        if (hasFlow) {
            return <div>
                <div style={{display: this.state.config ? 'none' : 'block'}}>
                    <div style={{fontWeight: 700}}>
                    Do you want to change or switch-off the Git-Flow configuration?
                    </div>
                    <div className='mt-10'>
                    git-flow has already configured for this repository. you may <br/>
                    change the Git-Flow configuration or switch-off the Git-Flow <br/>
                    features. In both cases, the file .git/config will be modified<br/>
                    accordingly.
                    </div>
                    <div className='text-right mt-15'>
                        <Button theme='primary' className='mr-5' onClick={this.changeConfig}>Change Configuration</Button>
                        <Button theme='primary' className='mr-5' onClick={this.switchOff}>Switch-Off Git-Flow</Button>
                        <Button onClick={this.close}>Cancel</Button>
                    </div>
                </div>
                <div style={{display: this.state.config ? 'block' : 'none'}}>
                    <div style={{fontWeight: 700}}>
                    configure the Git-Flow branch.
                    </div>
                    <Form labelWidth={140} className='mt-15' ref={f => this.form = f}>
                        <div>
                            <FormControl type='text' name='gitflow.branch.develop' label='Develop Branch:' itemStyle={{width: 300}}/>
                        </div>
                        <div>
                            <FormControl type='text' name='gitflow.branch.master' label='Master Branch:' itemStyle={{width: 300}}/>
                        </div>

                        <div className='mb-5 devide'>
                            <span>Prefixes</span>
                        </div>

                        <div>
                            <FormControl type='text' name='gitflow.prefix.feature' label='Feature Branches:' itemStyle={{width: 300}}/>
                        </div>
                        <div>
                            <FormControl type='text' name='gitflow.prefix.release' label='Release Branches:' itemStyle={{width: 300}}/>
                        </div>
                        <div>
                            <FormControl type='text' name='gitflow.prefix.hotfix' label='Hotfix Branches:' itemStyle={{width: 300}}/>
                        </div>
                        <div>
                            <FormControl type='text' name='gitflow.prefix.versiontag' label='Version Tags:' itemStyle={{width: 300}}/>
                        </div>
                    </Form>

                    <div className='text-right mt-15'>
                        <Button theme='primary' className='mr-5 text-center' style={{width: 80}} onClick={this.initGitFlow}>OK</Button>
                        <Button style={{width: 80}} onClick={this.resetClose}>Cancel</Button>
                    </div>
                </div>
            </div>;
        } else {
            return <div>
                <div style={{fontWeight: 700}}>
                    configure the Git-Flow branch.
                </div>
                <Form labelWidth={140} className='mt-15' ref={f => this.form = f}>
                    <div>
                        <FormControl type='text' name='gitflow.branch.develop' label='Develop Branch:' itemStyle={{width: 300}}/>
                    </div>
                    <div>
                        <FormControl type='text' name='gitflow.branch.master' label='Master Branch:' itemStyle={{width: 300}}/>
                    </div>

                    <div className='mb-5 devide'>
                        <span>Prefixes</span>
                    </div>

                    <div>
                        <FormControl type='text' name='gitflow.prefix.feature' label='Feature Branches:' itemStyle={{width: 300}}/>
                    </div>
                    <div>
                        <FormControl type='text' name='gitflow.prefix.release' label='Release Branches:' itemStyle={{width: 300}}/>
                    </div>
                    <div>
                        <FormControl type='text' name='gitflow.prefix.hotfix' label='Hotfix Branches:' itemStyle={{width: 300}}/>
                    </div>
                    <div>
                        <FormControl type='text' name='gitflow.prefix.versiontag' label='Version Tags:' itemStyle={{width: 300}}/>
                    </div>
                </Form>

                <div className='text-right mt-15'>
                    <Button theme='primary' className='mr-5 text-center' style={{width: 80}} onClick={this.initGitFlow}>OK</Button>
                    <Button style={{width: 80}} onClick={this.close}>Cancel</Button>
                </div>
            </div>;
        }
    }
}

export default FlowConfigContent;
