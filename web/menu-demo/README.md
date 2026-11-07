# Reusable Web Game Menus

The demo at [index.html](index.html) showcases five states: **main**, **playing**, **paused**, **settings**, and **gameover**.

## Reuse

Import `GameMenuController` from `../ui/game-menu-controller.js`. Instantiate with an `onChange(state, previous, action)` callback, then dispatch `transition(action)` from your actual game events. This controller does not own the game loop, save files, rendering, audio, navigation history, or game physics.

Example:

```js
import { GameMenuController } from './ui/game-menu-controller.js';
const menu = new GameMenuController({onChange: (state) => console.log(state)});
menu.transition('start');  // main -> playing
menu.transition('pause');  // playing -> paused
menu.transition('resume'); // paused -> playing
menu.transition('finish'); // playing -> gameover
```

Valid actions: `start`, `pause`, `resume`, `finish`, `settings`, `back`, `main`, `escape`. Disallowed transitions return `false`. Settings remembers whether it was opened from main or paused.

The menu-demo HTML and CSS are optional visual templates. Customize labels and theme variables without changing controller logic. The mock game increases score periodically only in the playing state; it is not a real game. The sound/volume settings persist, but no audio plays in this demo.

## Validation

Run `cd web && npm test` for controller unit tests. Manually verify keyboard Escape, touch targets, settings persistence, and phone widths in a browser. Real game integration must connect pause/resume to its own game loop and ensure UI input cannot pass through to gameplay.
