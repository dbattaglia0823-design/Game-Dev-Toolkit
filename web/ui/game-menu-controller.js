/** Framework-agnostic menu state transitions. No DOM or game-loop dependency. */
export class GameMenuController {
  constructor({ onChange = () => {} } = {}) {
    if (typeof onChange !== 'function') throw new TypeError('onChange must be a function');
    this.state = 'main';
    this.returnState = 'main';
    this.onChange = onChange;
  }
  transition(action) {
    const previous = this.state;
    switch (action) {
      case 'start':
        if (this.state !== 'main' && this.state !== 'gameover') return false;
        this.state = 'playing'; break;
      case 'pause':
        if (this.state !== 'playing') return false;
        this.state = 'paused'; break;
      case 'resume':
        if (this.state !== 'paused') return false;
        this.state = 'playing'; break;
      case 'finish':
        if (this.state !== 'playing') return false;
        this.state = 'gameover'; break;
      case 'settings':
        if (!['main', 'paused'].includes(this.state)) return false;
        this.returnState = this.state;
        this.state = 'settings'; break;
      case 'back':
        if (this.state !== 'settings') return false;
        this.state = this.returnState; break;
      case 'main':
        if (!['playing', 'paused', 'gameover'].includes(this.state)) return false;
        this.state = 'main'; break;
      case 'escape':
        if (this.state === 'playing') this.state = 'paused';
        else if (this.state === 'paused') this.state = 'playing';
        else if (this.state === 'settings') this.state = this.returnState;
        else return false;
        break;
      default: return false;
    }
    this.onChange(this.state, previous, action);
    return true;
  }
}
