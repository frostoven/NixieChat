import React from 'react';
import { ContactFinder } from '../components/ContactComponents/ContactFinder';

function showAddContactDialog() {
  $modal.alert({
    header: 'Add contact',
    body: <ContactFinder/>,
    actions: [],
  });
}

export {
  showAddContactDialog,
};
