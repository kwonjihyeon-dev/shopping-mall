// router.js - History API 활용
class Router {
  constructor(routes) {
    this.routes = routes;
    this.init();
  }

  render() {
    const path = location.pathname;
    const root = document.querySelector("#root");
    const element = this.routes[path]();
    if (!element) {
      root.innerHTML = this.routes["/404"]();
      return;
    }
    root.innerHTML = this.routes[path]();
  }

  init() {
    this.render();
    window.addEventListener("popstate", () => this.render());
  }

  push(url) {
    history.pushState(null, null, url);
    this.render();
  }
}

export default Router;
