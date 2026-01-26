/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";

import './index.css'
import Debug from './pages/Debug.tsx';
import Layout from './Layout.tsx';
import { Index } from './pages/Index.tsx';

const root = document.getElementById('root')

render(() =>
  <Router root={Layout}>
    <Route path="/" component={Index} />
    <Route path="/debug" component={Debug} />
  </Router>, root!)
