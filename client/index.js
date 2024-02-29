import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './modal';
import { RootNode } from './RootNode';
import { Dropdown } from 'semantic-ui-react';

if (
  location.protocol === 'http:' &&
  ![ 'localhost', '127.0.0.1' ].includes(location.hostname)
) {
  $dialog.alert({
    header: 'Cryptographic Error',
    body: (
      <div>
        This page was loaded over HTTP. Most browsers block cryptographic
        functions under HTTP.
        <br/>
        <br/>
        If account creation and loading refuses to run, you'll either need to
        switch to HTTPS or download the NixieChat app.
      </div>
    ),
  });
}

// This prop-type is incorrectly defined in the library. We override it here to
// prevent invalid console errors.
Dropdown.propTypes.text = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.element,
]);
console.log(Dropdown.propTypes);

async function boot() {
  const domContainer = document.querySelector('#react-element');
  const element = React.createElement;
  ReactDOM.render(element(RootNode), domContainer);
}

window.onload = function() {
  boot().catch(console.error);
};
