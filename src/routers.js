import React from 'react';
import asyncComponent from './AsyncComponent';
import { Route } from 'react-router-dom';

const routers = [];

const APP = asyncComponent(() => import('./App'));
export const AppRoute = <Route key='app' path='/' component={APP} />;

const Desktop = asyncComponent(() => import('./desktop'));
// const MML = asyncComponent(() => import('./pages/mml'));
// const MMLBatch = asyncComponent(() => import('./pages/mmlBatch'));
// const Permission = asyncComponent(() => import('./pages/permission'));
// const Help = asyncComponent(() => import('./pages/help'));
// const QA = asyncComponent(() => import('./pages/qa'));


routers.push(<Route key='Desktop' path='/desktop' component={Desktop} />);
// routers.push(<Route key='MML' path='/mml' component={MML} />);
// routers.push(<Route key='MMLBatch' path='/batch' component={MMLBatch} />);
// routers.push(<Route key='Permission' path='/permission' component={Permission} />);
// routers.push(<Route key='Help' path='/help' component={Help} />);
// routers.push(<Route key='QA' path='/qa' component={QA} />);

export default routers;
