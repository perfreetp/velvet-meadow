/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App.jsx';
import { store } from './lib/store.js';
import './styles.css';

if (import.meta.env.DEV) window.__store = store;

render(() => <App />, document.getElementById('root'));
