import React from 'react';
import Layout from 'r-cmui/components/Layout';
import routers from './routers';
import './App.less';
import {inject, observer} from 'mobx-react';

@inject('routing')
@observer
class App extends React.Component {
    displayName = 'App';

    componentDidMount () {
        const hash = window.location.hash;
        if (hash !== '#/desktop') {
            this.props.routing.push('/desktop');
        }
    }

    render () {
        return (
            <Layout className='app'>
                {routers}
            </Layout>
        );
    }
}

export default App;
