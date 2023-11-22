import React from 'react';
import PropTypes from 'prop-types';

const chatsListStyle = {
  // borderBottom: 'thin solid grey',
  paddingLeft: 2,
  paddingTop: 12,
  paddingBottom: 12,
};

const listStyle = {
  width: '100%',
  height: '100%',
  borderRight: 'thin solid grey',
  overflowY: 'auto',
};

const profilePhotoContainer = {
  display: 'inline-block',
  verticalAlign: 'top',
};

const profileIconStyle = {
  borderRadius: '100%',
  backgroundColor: 'grey',
  width: 42,
  height: 42,
  marginLeft: 4,
  marginRight: 12,
};

const contactInfoContainer = {
  display: 'inline-block'
};

const taperedLineStyle = {
  borderRadius: '15%',
  width: '97%',
  backgroundColor: 'grey',
  height: 1,
  margin: 'auto',
};

class OngoingChatsList extends React.Component {
  static propTypes = {
    //
  };

  static defaultProps = {
    //
  };

  genList = () => {
    const contacts = [
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
      {
        // Example structure.
        name: 'Name TBA',
        lastMessage: 'Last message shown here',
        photo: '',
      },
    ];

    const contactsJsx = [];

    for (let i = 0, len = contacts.length; i < len; i++) {
      const { name, lastMessage } = contacts[i];
      contactsJsx.push(
        <div key={`contacts-list-${i}`} style={chatsListStyle}>

          {/* Contact profile photo */}
          <div style={profilePhotoContainer}>
            <div style={profileIconStyle}>
              &nbsp;
            </div>
          </div>

          {/* Contact name and recent message */}
          <div style={contactInfoContainer}>
            <div>
              <div><b>{name}</b></div>
              <div>{lastMessage}</div>
            </div>
          </div>

        </div>,
        <div style={taperedLineStyle}>
          &nbsp;
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
  OngoingChatsList,
};
