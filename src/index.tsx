/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";

import './index.css'
import { IndexPage } from './pages/Index.tsx';
import { RootLayout } from './layouts/RootLayout.tsx';
import { PlayPage } from './pages/Play.tsx';
import { BottomBarLayout } from './layouts/BottomBarLayout.tsx';

const root = document.getElementById('root')

render(() =>
  <Router root={RootLayout}>
    <Route path="/" component={IndexPage} />
    <Route path='/play' component={BottomBarLayout}>
      <Route path="/" component={PlayPage} />
    </Route>
  </Router>, root!)
