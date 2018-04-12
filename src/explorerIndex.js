import ReactGA from 'react-ga';
import { setAppName, setVersion, APP_EXPLORER } from './config';
import { setAppColors } from './styles/colors';
import initializeApp from './index';
import routes from './routes/explorerRoutes';

/**
 * This serves as the primary entry point to the Media Cloud Explorer app.
 */
ReactGA.initialize('UA-60744513-11');

setVersion('2.7.6');

setAppName(APP_EXPLORER);

setAppColors({
  light: '#AF53A7',
  dark: '#8F3387',  // primary
  darker: '#6F1367',
});

initializeApp(routes);
