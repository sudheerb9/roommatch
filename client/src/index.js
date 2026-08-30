// Browser entrypoint that mounts the React application.
import './index.css';
import { initAutterBrowser } from '@autter/runtime-browser';
import { mountApp } from './bootstrapRoot';
import reportWebVitals from './reportWebVitals';

if (process.env.REACT_APP_AUTTER_ENABLED === 'true') {
  const clientKey = process.env.REACT_APP_AUTTER_CLIENT_KEY;
  initAutterBrowser(
    clientKey
      ? {
          endpoint: 'https://otlp.autter.dev/v1/browser',
          clientKey,
          service: 'roommatch-web',
          environment: process.env.NODE_ENV,
        }
      : {
          endpoint: `${process.env.REACT_APP_API_BASE_URL}/api/autter-runtime`,
          service: 'roommatch-web',
          environment: process.env.NODE_ENV,
        },
  );
}

mountApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
