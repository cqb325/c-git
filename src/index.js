import React from 'react';
import ReactDOM from 'react-dom';
import {createHashHistory} from 'history';
import { Provider } from 'mobx-react';
import { syncHistoryWithStore } from 'mobx-react-router';
import { HashRouter as Router } from 'react-router-dom';
import stores from './store/index';
import {AppRoute} from './routers';
import 'r-cmui/styles/theme.less';
import 'r-cmui/styles/font-awesome.min.css';
import './fonts/material-design-iconic-font/css/material-design-iconic-font.min.css';
window.RCMUI_LANG = 'us_en';
const browserHistory = createHashHistory();

syncHistoryWithStore(browserHistory, stores.routing);
ReactDOM.render(
    <Provider {...stores}>
        <Router>
            {AppRoute}
        </Router>
    </Provider>,
    document.getElementById('root')
);
