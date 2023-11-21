import React from 'react';
import {
  Header,
  Icon,
  Menu,
  Sidebar,
} from 'semantic-ui-react';
import { ContactsAndChatGrid } from './ContactsAndChatGrid';

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
  const { children, sidebarItems, onPusherClick, visible } = props;
  return (
    <Sidebar.Pushable style={{ ...overlayStyle, zIndex: 5 }}>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        inverted
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
  const { onToggle, rightItems } = props;
  return (
    <>
      <Menu fixed="top" inverted>
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
    { ...overlayStyle, top: 67, left: 0, zIndex: 5 }
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

const sidebarItems = [
  {
    as: 'div', key: 'heading', content: (
      <NixieHeader
        style={{
          paddingTop: 7,
          paddingBottom: 7,
          paddingLeft: 56.5,
        }}
      />
    ),
  },
  { as: 'div', content: <b>Active account: [name]</b>, key: 'accountName' },
  { as: 'a', content: 'Switch Account', key: 'switchAccount' },
  { as: 'a', content: 'Dark Mode', key: 'darkMode' },
];
const rightItems = [
  { as: 'a', content: 'Button', key: 'doSomethingWithMe' },
];

class MainSection extends React.Component {
  render() {
    return (
      <NavBar sidebarItems={sidebarItems} rightItems={rightItems}>
        <ContactsAndChatGrid/>
      </NavBar>
    );
  }
}

export {
  MainSection,
};
