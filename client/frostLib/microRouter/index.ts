/**
 * This file released by Frostoven under the MIT License.
 */

interface RouteInfo {
  // The route to go to if the user presses the back button.
  back: string,
}

interface Rule {
  to: string,
  nav: RouteInfo,
  onBackTriggered: Function,
}

interface ChangeRouteSignature {
  to: string,
  nav: RouteInfo,
  onBackTriggered: Function,
}

/**
 * The purpose of this class is to make route traversal act like that of a
 * mobile app: The back button traverses to a specific component rather than
 * the previous component (e.g. pressing back in the chat window should not
 * open emoticons), and reopening the app should only resume at the last-known
 * component if the app is still in RAM (else it should return to the root
 * node).
 *
 * The idea is that the parent component tells the router how a nested
 * component should be handled. The nested component can then append rules for
 * its own nested components as needed. This means the root node does not care
 * about how the rest of the app is structured, and we then also have
 * router-capable reusability between components.
 *
 * This class uses parameter syntax (/?view=whatever) instead of directory-like
 * syntax (/whatever) to make it clear that the route is a hint rather than a
 * bookmarkable location.
 *
 * <b>Security Note:</b> Routes are easily viewed by third parties, so please
 * don't include any uniquely identifiable information (such as contact IDs) in
 * the routes.
 *
 * @example
 *
 * // Inside your root node:
 * componentDidMount() {
 *   microRouter.init();
 * }
 *
 * // Inside a component that will route to a nested component:
 * onClick = () => {
 *   microRouter.changeRoute({
 *     to: 'chat',
 *     nav: { back: '/' },
 *     onBackTriggered: () => {
 *       this.onCloseChat();
 *     },
 *   });
 * }
 */
class MicroRouter {
  private _initialized = false;
  private _virtualRoute = '/';
  private _existingRules: { [key: string]: Rule } = {};
  private _activeRule: Rule | null = null;
  private _exitTriggered = false;

  init() {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    const initTime = Date.now();
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.size) {
      // During init, revert to the root node.
      history.pushState('route', '', '/');
    }

    window.addEventListener('popstate', () => {
      let rule = this._activeRule;

      if (this._exitTriggered || !rule) {
        // In case the browser sends a popstate on page load, ignore it for
        // 1.5s after launch.
        if (this._virtualRoute === '/' && Date.now() - initTime > 1500) {
          // Exit the page.
          this._exitTriggered = true;
          history.replaceState('route', '', '/');
          // Per spec, this will go back if possible, or do nothing if there's
          // no history.
          history.go(-1);
        }
        else {
          history.pushState('route', '', '/');
          this._virtualRoute = '/';
        }
        return;
      }

      const { nav, onBackTriggered } = rule;

      const nextPath = nav.back === '/' ? '/' : `?view=${nav.back}`;
      history.pushState('route', '', nextPath);
      this._virtualRoute = nav.back;

      onBackTriggered();
      this._activeRule = this._existingRules[nav.back] || null;
    });
  }

  /**
   * Adds a rule, and navigates there. If another rule by the same name exists,
   * replaces it.
   * @param to
   * @param nav
   * @param onBackTriggered
   */
  changeRoute({ to, nav, onBackTriggered }: ChangeRouteSignature) {
    this._exitTriggered = false;
    if (to !== this._virtualRoute) {
      if (this._virtualRoute !== '/') {
        // Technically not needed, but stops history from getting too long.
        history.replaceState('route', '', `?view=${to}`);
      }
      else {
        history.pushState('route', '', `?view=${to}`);
      }
      this._virtualRoute = to;
    }

    this._activeRule = this._existingRules[to] = {
      to, nav: nav, onBackTriggered,
    };
  }

  back() {
    this._exitTriggered = false;
    const backPath = this._activeRule?.nav.back || '/';
    const next = this._existingRules[backPath];
    if (!next) {
      history.back();
    }
    else {
      this.changeRoute(next);
    }
  }

  get currentRoute() {
    return this._virtualRoute;
  }
}

const microRouter = new MicroRouter();

export {
  microRouter,
};
