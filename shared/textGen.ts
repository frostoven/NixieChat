import { SemanticCOLORS } from 'semantic-ui-react';

// Used for randomly generating private account names.
// Example output: 'Phantom 69'
function randomAccountName(
  rngLength = 2, includeSpace = true, additionalNames = [],
) {
  // Set: Creature types, but not character names.
  const nameTypes = [
    'Phantom', 'Shade', 'Nameless', 'Kraken', 'Wolfe', 'Manticore', 'Raptor',
    'Hecatoncheires', 'Minotaur', 'Hydra', 'Pegasus', 'Chimera', 'Fox',
    'Feline',
    ...additionalNames,
  ];

  let separator = includeSpace ? ' ' : '';

  return (
    nameTypes[~~(nameTypes.length * Math.random())] +
    separator +
    `${Math.random()}`.slice(-rngLength)
  );
}

// Used to pick a server error message at random. The reason we randomise them
// is that they all look pretty, and all look like valid error message
// candidates due to their bright backgrounds.
function randomErrorColor(): SemanticCOLORS {
  const options = [
    'orange', 'olive', 'teal', 'blue', 'violet', 'purple', 'pink',
  ];
  return options[~~(options.length * Math.random())] as SemanticCOLORS;
}

export {
  randomAccountName,
  randomErrorColor,
};
