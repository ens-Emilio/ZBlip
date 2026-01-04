export type ShortcutAction = 'play_pause' | 'seek_forward' | 'seek_backward' | 'undo' | 'redo';

const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  play_pause: ' ',
  seek_forward: 'ArrowRight',
  seek_backward: 'ArrowLeft',
  undo: 'Ctrl+z',
  redo: 'Ctrl+Shift+z',
};

export class KeyboardShortcutManager {
  private shortcuts = new Map<string, ShortcutAction>();
  private handlers = new Map<ShortcutAction, () => void>();
  private keyListener = this.handleKeyDown.bind(this);

  constructor() {
    Object.entries(DEFAULT_SHORTCUTS).forEach(([action, key]) => {
      this.shortcuts.set(key, action as ShortcutAction);
    });
    window.addEventListener('keydown', this.keyListener);
  }

  on(action: ShortcutAction, handler: () => void) {
    this.handlers.set(action, handler);
  }

  off(action: ShortcutAction) {
    this.handlers.delete(action);
  }

  destroy() {
    window.removeEventListener('keydown', this.keyListener);
    this.handlers.clear();
  }

  private handleKeyDown(event: KeyboardEvent) {
    const baseKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const keySig = `${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${baseKey}`;
    const action = this.shortcuts.get(keySig);
    if (!action) return;
    const handler = this.handlers.get(action);
    if (handler) {
      event.preventDefault();
      handler();
    }
  }
}
