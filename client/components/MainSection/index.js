import React from 'react';
import {
  Container,
  Header,
  Icon,
  Menu,
  Sidebar,
} from 'semantic-ui-react';
import { ContactsAndChatGrid } from '../ChatComponents/ContactsAndChatGrid';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { AccountsScreen } from '../AccountsScreen';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const NixieHeader = ({ style } = {}) => {
  return (
    <Header as="h4" style={{ ...style, fontWeight: 'bold' }}>
      NixieChat
    </Header>
  );
};

const Pusher = (props) => {
  const darkMode = UnencryptedSettings.isDarkModeEnabled() || false;
  const { children, sidebarItems, onPusherClick, visible } = props;
  return (
    <Sidebar.Pushable style={{ ...overlayStyle, zIndex: 5, right: -10 }}>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        inverted={!darkMode}
        items={sidebarItems}
        vertical
        visible={visible}
        style={{ minWidth: 220 }}
      />
      <Sidebar.Pusher
        dimmed={visible}
        onClick={onPusherClick}
        style={{ ...overlayStyle, zIndex: 4 }}
      >
        {children || null}
      </Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

const NavBarContents = (props) => {
  const darkMode = UnencryptedSettings.isDarkModeEnabled();
  const { onToggle, rightItems } = props;
  return (
    <>
      <Menu fixed="top" inverted={!darkMode}>
        <Menu.Item onClick={onToggle}>
          <Icon name="sidebar"/>
        </Menu.Item>
        <Menu.Item>
          <NixieHeader/>
        </Menu.Item>
        <Menu.Menu position="right">
          {rightItems.map((item) => (
            <Menu.Item {...item} />
          ))}
        </Menu.Menu>
      </Menu>
    </>
  );
};

const PageContents = (props) => (
  <div style={
    { ...overlayStyle, top: 63, bottom: -27, left: 0, zIndex: 5 }
  }>
    {props.children}
  </div>
);

class NavBar extends React.Component {
  state = {
    visible: false,
  };

  handlePusher = () => {
    const { visible } = this.state;
    if (visible) this.setState({ visible: false });
  };

  handleToggle = () => this.setState({ visible: !this.state.visible });

  render() {
    const { children, sidebarItems, rightItems } = this.props;
    const { visible } = this.state;

    const sidebar = (
      <>
        <NavBarContents
          sidebarItems={sidebarItems}
          onPusherClick={this.handlePusher}
          onToggle={this.handleToggle}
          rightItems={rightItems}
          visible={visible}
        >
        </NavBarContents>
        <PageContents>{children}</PageContents>
      </>
    );


    if (visible) {
      return (
        <Pusher
          sidebarItems={sidebarItems}
          onPusherClick={this.handlePusher}
          onToggle={this.handleToggle}
          rightItems={rightItems}
          visible={visible}
        >
          {sidebar}
        </Pusher>
      );
    }
    else {
      return sidebar;
    }
  }
}

const sidebarItems = () => {
  const darkMode = UnencryptedSettings.isDarkModeEnabled();
  return [
    {
      key: 'heading',
      as: 'div',
      content: (
        <NixieHeader
          style={{
            paddingTop: 1,
            paddingLeft: 57,
          }}
        />
      ),
    },
    {
      key: 'accountName',
      as: 'div',
      content: <b>Active account: [name]</b>,
    },
    {
      key: 'switchAccount',
      as: 'a',
      content: (
        <Container fluid><Icon name="at"></Icon>Switch Account</Container>
      ),
    },
    {
      key: 'darkMode',
      as: 'a',
      content: (
        <Container fluid>
          <Icon name={darkMode ? 'moon outline' : 'moon'}/>Dark Mode
          &nbsp;&nbsp;
          <Icon name={darkMode ? 'toggle on' : 'toggle off'}/>
        </Container>
      ),
      onClick: () => UnencryptedSettings.toggleDarkMode(true),
    },
  ];
};

const rightItems = () => [
  { as: 'a', content: 'Become Invisible', key: 'becomeInvisible' },
];

class MainSection extends React.Component {
  accountStorage = new EncryptedAccountStorage();

  render() {
    if (this.accountStorage.getActiveAccount() === null) {
      return <AccountsScreen onAccountActivated={() => {
        this.forceUpdate();
      }}/>;
    }

    return (
      <NavBar sidebarItems={sidebarItems()} rightItems={rightItems()}>
        <ContactsAndChatGrid/>
      </NavBar>
    );
  }
}

export {
  MainSection,
};
