/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";

import './index.css'
import { IndexPage } from './pages/Index.tsx';
import { DebugPage } from './pages/Debug.tsx';
import { RootLayout } from './layouts/RootLayout.tsx';
import { PlayPage } from './pages/Play.tsx';

const root = document.getElementById('root')

render(() =>
  <Router root={RootLayout}>
    <Route path="/" component={IndexPage} />
    <Route path="/play" component={PlayPage} />
    <Route path="/debug" component={DebugPage} />
  </Router>, root!)
