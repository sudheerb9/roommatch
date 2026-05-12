// Browser entrypoint that mounts the React application.
import './index.css';
import { mountApp } from './bootstrapRoot';
import reportWebVitals from './reportWebVitals';

mountApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
