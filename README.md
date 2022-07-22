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

## Options
```
-o, --out <path>       Specific the output file path
--tpl <content>        Specific the output template. Support variables: $name, $svg, $string, $path, $viewBox,
						$markdown
--postfix <name>       Specific the variable name postfix
--height <size>        Resize icons to specific height
--min                  Optimize size of svg
--minWidth <size>      Resize icons to specific width
--removeColor          Remove colors in svg
--removeTitle          Remove titles in svg
--removeRoot           Remove root in svg
--removeAttrs <attrs>  Remove attributes in svg
--offsetX <size>       translate icons horizontally
--offsetY <size>       translate icons vertically
-v, -V, --version      Print version
-h, -?, --help         Print the message
```