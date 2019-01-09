import hashHistory from 'react-router/lib/hashHistory';
import { routerMiddleware } from 'react-router-redux';
import Raven from 'raven-js';
import createRavenMiddleware from 'raven-for-redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-simple-promise';
import { createStore, applyMiddleware, compose } from 'redux';
import { errorReportingMiddleware } from './lib/reduxHelpers';
import getRootReducer from './reducers/root';
import { isDevMode } from './config';

const reduxRouterMiddleware = routerMiddleware(hashHistory);

const middlewares = [
  promiseMiddleware(),
  reduxRouterMiddleware,
  thunkMiddleware,
  errorReportingMiddleware,
];

function configDevelopmentStore(appName) {
  /* eslint-disable no-underscore-dangle */
  return createStore(getRootReducer(appName), {}, compose(
    applyMiddleware(...middlewares),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  ));
  /* eslint-enable */
}

function configProductionStore(appName) {
  return createStore(getRootReducer(appName), {}, compose(
    applyMiddleware(...middlewares,
      createRavenMiddleware(Raven, {
        breadcrumbDataFromAction: action => (
          { STRING: action.str }
        ),
      })),
  ));
}

let store; // singleton store

// acts as a singleton factory method
function getStore(appName) {
  if (store === undefined) {
    store = (isDevMode()) ? configDevelopmentStore(appName) : configProductionStore(appName);
  }
  return store;
}

export default getStore;
