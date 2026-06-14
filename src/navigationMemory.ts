let lastRoute: string | null = null;

export function setLastRoute(route: string) {
  lastRoute = route;
}

export function getLastRoute() {
  return lastRoute;
}