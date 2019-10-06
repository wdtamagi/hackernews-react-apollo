import React from 'react'
import { Switch, Route } from 'react-router-dom'

import '../styles/App.css'
import LinkList from './LinkList'
import Header from './Header'
import CreateLink from './CreateLink'

const App = props => (
  <div className="center w85">
    <Header />
    <div className="ph3 pv1 background-gray">
      <Switch>
        <Route exact path="/" component={LinkList} />
        <Route exact path="/create" component={CreateLink} />
      </Switch>
    </div>
  </div>
)

export default App
