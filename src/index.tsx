/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";

import './index.css'
import App from './App.tsx'
import Debug from './debug.tsx';
import Layout from './Layout.tsx';

const root = document.getElementById('root')

render(() =>
  <Router root={Layout}>
    <Route path="/" component={App} />
    <Route path="/debug" component={Debug} />
  </Router>, root!)
