import React from 'react';

const activeChatStyle = {
  backgroundImage: 'url(/assets/backgrounds/defaultPattern.svg)',
  padding: 8,
};

class ActiveChat extends React.Component {
  render() {
    return (
      <div style={activeChatStyle}>
        // active chat here NG
      </div>
    )
  }
}

export {
  ActiveChat,
}
