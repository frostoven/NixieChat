# Info

Offers a non-blocking API that resembles DOM dialog functions.

That this was (with permission) taken from the Cosmosis game project. This
document may have some redundant references.

_Dev note: When the modal system is busy, no other control systems should
process input. This can be checked via `$modal.allowExternalListeners`._

## Special keys

Pressing Escape closes the top-most dialog window.

If you pass in a callback when creating a dialog window, your callback will
receive `null` to indicate that a cancellation has occurred.

# Examples

## Alert

Can be used as a simple replacement for `window.alert()` , or as a more
advanced dialog builder. Displays a message.

#### Simple alert:

```javascript
$modal.alert('Your message here.');
```

#### Callback on user accept:

```javascript
// Placing a callback as a last option will notify you when the user selects
// the built-in OK button.
$modal.alert('Your message here.', () => {
  console.log('The user has selected "OK".');
});
```

#### Alert with custom header:

```javascript
$modal.alert({
  header: 'I Am The Header',
  body: 'Your message here.',
});
```

#### Alert with custom text on its button:

```javascript
$modal.alert({
  header: 'Info',
  body: 'The Earth can fit eight times inside Saturn\'s hexigon storm.',
  actions: [
    { name: 'Damn, ok..', onSelect: () => $modal.deactivateModal() },
  ]
});
```

#### Alerts can be used as generic dialog builders:

_**Note:** `$modal.confirm()` would be better suited than this next example as
it's more concise. This is just to showcase the alert builder._

```javascript
$modal.alert({
  header: 'Question',
  body: 'Left or right?',
  actions: [
    {
      name: 'Left',
      onSelect: () => console.log('left') || $modal.deactivateModal()
    },
    {
      name: 'Right',
      onSelect: () => console.log('right') || $modal.deactivateModal()
    },
  ]
});
```

## Confirm

Can be used as a simple replacement for `window.confirm()` , or as a more
advanced dialog builder. Asks the user to approve or confirm something.

#### Simple confirmation window:

```javascript
$modal.confirm('Are you want to proceed?', (answer) => {
  // true if 'Yes', false if 'No'. 
  console.log(answer);
});
```

#### Confirm with custom header:

```javascript
$modal.confirm({
  header: 'I Am The Header',
  body: 'Are you want to proceed?',
}, (answer) => {
  console.log(answer);
});
```

#### Confirm with custom buttons:

```javascript
$modal.confirm({
  body: 'Left or right?',
  actions: [
    { name: 'Left, to Dark Woods', onSelect: () => $modal.deactivateModal() },
    {
      name: 'Right, to Werewolf Mountain',
      onSelect: () => $modal.deactivateModal()
    },
  ]
});
```

## Prompt

Can be used as a simple replacement for `window.prompt()` , or as a more
advanced dialog builder. Prompts the user for text.

```javascript
$modal.prompt('Please enter your call sign:', (value) => {
  if (value === null) {
    console.log('[ user cancelled input ]');
  }
  else {
    console.log('User entered:', value);
  }
});
```

As with all other modals, headers and buttons can be customised:

```javascript
$modal.prompt({
  header: 'I Am The Header',
  body: 'Please enter your ship\'s name:',
  actions: [
    { name: 'Randomize', onSelect: () => $modal.deactivateModal() },
    { name: 'Accept', onSelect: () => $modal.deactivateModal() },
    { name: 'Cancel', onSelect: () => $modal.deactivateModal() },
  ]
});
```

## Button Prompt

Offers a list of buttons to select from.

```javascript
$modal.buttonPrompt({
  body: 'Please select an action:',
  actions: [
    { name: 'Start new session', value: 1 },
    { name: 'View profile', value: 2 },
    { name: 'View available lobbies', value: 3 },
    { name: 'Close', value: 4 },
  ]
}, (userSelection) => {
  // Contains: { name, value, onSelect }.
  console.log(userSelection);
});
```

## List Prompt

Offers a list of items to select from. Meant to be used as a
controller-friendly substitute for dropdowns, or situations where the amount of
selectable options are quite large.

```javascript
$modal.listPrompt({
  // Note: setting enableAnimations forces it on or off. If not specified,
  // $modal will disable animations if the amount of actions are large (20
  // items at the time of writing). Enabling animations with 30+ actions in the
  // list is incredibly slow and will hard-freeze the interface when scrolling.
  enableAnimations: true,
  actions: [
    { name: 'Option 1', value: 1 },
    { name: 'View profile', value: 2 },
    { name: 'View available lobbies', value: 3 },
    { name: 'Second-to-last option', value: 4 },
    { name: 'Close', value: 5 },
  ]
}, (userSelection) => {
  // Contains: { name, value, onSelect }.
  console.log(userSelection);
});
```

## Capturing Keys and Analog actions

For situations where you want to capture a specific key (such as for user
control bindings), `$modal` has a key capture function built right in. The rest
of the game will entirely ignore input while key capture dialogs are open.

`$modal` also includes methods which aren't true captures, but descriptive
selections, such as mouse axis choosers. For consistency, these dialogs also
start with the term `capture` even though they aren't technically capture
functions.

#### Automatic

You can use `autoInputCapture()` to let the user decide the type of input to
capture, which will then choose one of the methods in this section below.

```javascript
// Let the user choose which device to capture:
$modal.autoInputCapture((code) => {
  // Example outputs: 'KeyW', 'spMouseMiddle', 'bt10'
  console.log(code);
});

// You may optionally add a filter to reduce the amount of devices to choose
// from:
let filter = [ InputType.gamepadAxisStandard, InputType.mouseAxisStandard ];
$modal.autoInputCapture(filter, (code) => {
  // Example outputs: 'spEastWest', 'ax1'
  console.log(code);
});
```

#### Keyboard code capture

```javascript
$modal.captureKeyboardKey((keyCode) => {
  // Example output: 'ArrowUp'
  console.log(keyCode);
});
```

#### Mouse button / scroll chooser

```javascript
// Capture a mouse click:
$modal.captureMouseButton((spCode) => {
  // Example outputs: 'spMouseLeft', 'spMouseMiddle'
  console.log(spCode);
});

// To include the scroll wheel as an option:
$modal.captureMouseButton({ allowScroller: true }, (spCode) => {
  // Example outputs: 'spMouseRight','spScrollUp','spScrollDown'
  console.log(spCode);
});
```

#### Mouse axis chooser

```javascript
$modal.captureMouseAxis((spCode) => {
  // Example outputs: 'spNorthSouth' or 'spEastWest'
  console.log(spCode);
});
```

#### Gamepad button capture

```javascript
$modal.captureGamepadButton((buttonCode) => {
  // Example outputs: 'bt0', 'hb24'
  console.log(buttonCode);
});
```

#### Gamepad axis capture

```javascript
$modal.captureGamepadAxis((axisData) => {
  // Example outputs: 'ax1', 'ha3'
  console.log(axisData);
});
```

## Other modal API details

This is not an exhaustive list, updating this properly in the todo.

Any modal functions that do not start with an underscore may be used freely.
Any functions that do start with an underscore should be avoided, otherwise you
might corrupt modal state. The modal class supports things like modal stacking
and live modal editing, so messing with its internal state via underscored
functions can break code that runs later on.

#### Variables

The only variables you'll really want to care about for most situations is are
the static ones. You can reach them by importing Modal, or via `$modal.static`.

* `Modal.allowExternalListeners` - while this is false, you should avoid
  letting your own input plugins control game state.
* 
#### Methods

* `$modal.deactivateModal(optionalCallback)` - closes the top-most modal. If
  you want to do additional modal work immediately after  `deactivateModal()`,
  be sure to wrap it inside `optionalCallback` to ensure your code doesn't
  suffer state-update timing issues.
* `$modal.buildModal(options)` - used internally by all the other modal
   functions in the Examples section above to create modals.
* `$modal.modifyModal(modalOptions)` - replaces the active modal with the
  contents of the specified `modalOptions`; especially useful when used with
  `$modal.getActiveModal()`, which will return the active modal options.
* `$modal.getActiveModal()` - gets the object that defines the actively
  displayed dialog, or undefined if nothing is being shown.
