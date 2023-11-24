import * as ReactDOM from 'react-dom';
import React from 'react';
import Modal from './Modal';

// Add CSS style tag.
const style = document.createElement('style');
// style.type = 'text/css';
style.innerHTML = `
  .__kosmModalRoot {
    overflow: auto;
  }

  .kosm-modal {
    top: 50%;
    transform: translateY(-50%);
  }

  .kosm-modal-actions {
    text-align: right;
    padding-bottom: 4px;
  }
`;
document.getElementsByTagName('head')[0].appendChild(style);

// Create the modal root node.
const div = document.createElement('div');
div.className = '__kosmModalRoot';
div.style.position = 'fixed';
document.body.append(div);
ReactDOM.render(<Modal/>, div);
