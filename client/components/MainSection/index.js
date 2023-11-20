import React from 'react';
import {
  Container,
  Header,
  Icon,
  Menu,
  Sidebar,
} from 'semantic-ui-react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const Pusher = (props) => {
  const { children, sidebarItems, onPusherClick, visible } = props;
  return (
    <Sidebar.Pushable style={overlayStyle}>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        inverted
        items={sidebarItems}
        vertical
        visible={visible}
      />
      <Sidebar.Pusher
        dimmed={visible}
        onClick={onPusherClick}
        style={overlayStyle}
      >
        {children || null}
      </Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

const NavBarContents = (props) => {
  const { onToggle, rightItems } = props;
  return (
    <Menu fixed="top" inverted>
      <Menu.Item onClick={onToggle}>
        <Icon name="sidebar"/>
      </Menu.Item>
      <Menu.Item>
        <Header as="h4" style={{ fontWeight: 'bold' }}>
          NixieChat
        </Header>
      </Menu.Item>
      <Menu.Menu position="right">
        {rightItems.map((item) => (
          <Menu.Item {...item} />
        ))}
      </Menu.Menu>
    </Menu>
  );
};

const NavBarChildren = (props) => (
  <Container style={{ marginTop: '5em' }}>{props.children}</Container>
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

    const menuContents =
      <NavBarContents
        sidebarItems={sidebarItems}
        onPusherClick={this.handlePusher}
        onToggle={this.handleToggle}
        rightItems={rightItems}
        visible={visible}
      >
        <NavBarChildren>{children}</NavBarChildren>
      </NavBarContents>;

    if (visible) {
      return (
        <Pusher
          sidebarItems={sidebarItems}
          onPusherClick={this.handlePusher}
          onToggle={this.handleToggle}
          rightItems={rightItems}
          visible={visible}
        >
          {menuContents}
        </Pusher>
      );
    }

    return menuContents;
  }
}

const sidebarItems = [
  { as: 'div', content: <b>Active account: [name]</b>, key: 'accountName' },
  { as: 'a', content: 'Switch Account', key: 'switchAccount' },
  { as: 'a', content: 'Dark Mode', key: 'darkMode' },
];
const rightItems = [
  { as: 'a', content: 'Button', key: 'doSomethingWithMe' },
];

const MainSection = () => (
  <NavBar sidebarItems={sidebarItems} rightItems={rightItems}/>
);

export {
  MainSection,
};
