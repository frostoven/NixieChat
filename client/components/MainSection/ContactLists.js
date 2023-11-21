import React from 'react';
import PropTypes from 'prop-types';

const listStyle = {
  width: '100%',
  height: '100%',
  borderRight: 'thin solid grey',
};

class ContactsList extends React.Component {
  static propTypes = {
    //
  };

  static defaultProps = {
    //
  };

  genList = () => {
    const contacts = [
      {
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
        online: false,
      },
      {
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
        online: false,
      },
      {
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
        online: false,
      },
      {
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
        online: false,
      },
    ];

    const contactsJsx = [];

    for (let i = 0, len = contacts.length; i < len; i++) {
      const { name, lastMessage } = contacts[i];
      contactsJsx.push(
        <div key={`contacts-list-${i}`} style={{
          borderBottom: 'thin solid grey',
          paddingLeft: 2,
          paddingTop: 12,
          paddingBottom: 12,
        }}>
          <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
            <div
              style={{
                borderRadius: '100%',
                backgroundColor: 'grey',
                width: 42,
                height: 42,
                marginLeft: 4,
                marginRight: 12,
              }}
            >
              &nbsp;
            </div>
          </div>
          <div
            style={{ display: 'inline-block' }}
          >
            <div>
              <div><b>{name}</b></div>
              <div>{lastMessage}</div>
            </div>
          </div>
        </div>,
      );
    }

    return contactsJsx;
  };

  render() {
    return (
      <div style={listStyle}>
        {this.genList()}
      </div>
    );
  }
}

export {
  ContactsList,
};
