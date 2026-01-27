/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";

import './index.css'
import { IndexPage } from './pages/Index.tsx';
import { RootLayout } from './layouts/RootLayout.tsx';
import { PlayPage } from './pages/Play.tsx';
import { GameLayout } from './layouts/GameLayout.tsx';
import { DevLayout } from './layouts/DevLayout.tsx';

const root = document.getElementById('root')

render(() =>
  <Router root={RootLayout}>
    <Route path="/" component={IndexPage} />
    <Route path='/play' component={DevLayout}>
      <Route path='/' component={GameLayout}>
        <Route path="/" component={PlayPage} />
      </Route>
    </Route>
  </Router>, root!)
