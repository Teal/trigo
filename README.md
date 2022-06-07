# Trigo
An icon solution for web.

## Features
1. Use `<svg>` icons in your web pages.
2. Better performance as icons are inlined in html.
3. Support css customize and animation.
4. Support tree-shaking unused icons.
5. Support svg optimizing.

## Usage
```bash
trigo icons/**/*.svg --out icons.js
```

In your code:
```js
import { iconName } from "./icons"

console.log(iconName)
```