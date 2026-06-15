const stack: string[] = [];

export function pushRoute(route: string) {
  if (stack[stack.length - 1] !== route) {
    stack.push(route);
  }
}

export function popRoute() {
  stack.pop(); // убираем текущую
  return stack.pop(); // возвращаем предыдущую
}