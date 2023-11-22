import React from 'react';

const activeChatStyle = {
  padding: 8,
  backgroundImage: 'url(/assets/backgrounds/defaultPattern.svg)',
  backgroundSize: 392,
};

class ActiveChat extends React.Component {
  render() {
    return (
      <div style={activeChatStyle}>
        // active chat
      </div>
    )
  }
}

export {
  ActiveChat,
}
