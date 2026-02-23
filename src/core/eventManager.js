class EventManager {
  constructor() {
    this.root = null;
    this.handlers = new Map(); // eventType → Map<handlerName, fn>
  }

  mount(root) {
    this.root = root;
  }

  _ensureDelegation(eventType) {
    if (this.handlers.has(eventType)) return;

    this.handlers.set(eventType, new Map());

    this.root.addEventListener(eventType, (e) => {
      const attr = `data-on-${eventType}`;
      const target = e.target.closest(`[${attr}]`);
      if (!target) return;

      const handlerName = target.getAttribute(attr);
      const fn = this.handlers.get(eventType)?.get(handlerName);
      if (fn) fn(e, target);
    });
  }

  on(eventType, name, fn) {
    this._ensureDelegation(eventType);
    this.handlers.get(eventType).set(name, fn);
  }

  off(eventType, name) {
    this.handlers.get(eventType)?.delete(name);
  }

  destroy() {
    this.handlers.clear();
    this.root = null;
  }
}

export const eventManager = new EventManager();
