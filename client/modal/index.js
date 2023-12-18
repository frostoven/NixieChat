import * as ReactDOM from 'react-dom';
import React from 'react';
import Modal from './Modal';
import './nixieDialogs';

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

  .kosm-modal.inverted > .header {
    color: #000;
    background-color: #a4f2ac;
  }
  
  .kosm-modal.inverted,
  .kosm-modal.inverted .content,
  .kosm-modal.inverted .content .header
  {
    color: #000;
    background-color: #fff;
  }

  .kosm-modal-actions {
    text-align: right;
    padding-bottom: 4px;
  }

  .inverted .kosm-modal-actions .ui.primary.button {
    background-color: #53ad39;
  }

  .inverted .kosm-modal-actions .ui.secondary.button {
    background-color: #53ad39;
  }
`;
document.getElementsByTagName('head')[0].appendChild(style);

// Create the modal root node.
const div = document.createElement('div');
div.className = '__kosmModalRoot';
div.style.position = 'fixed';
document.body.append(div);
ReactDOM.render(<Modal/>, div);
