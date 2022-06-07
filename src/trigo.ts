import { encodeDataURI } from "tutils/base64"
import { getName } from "tutils/path"
import { optimizeSVG, OptimizeSVGOptions } from "./svgOptimizor"

/**
 * 打包图标文件
 * @param options 选项
 */
export default function trigo(inputs: { path: string, content: string }[], tpl = "$svg", options?: OptimizeSVGOptions) {
	let result: string[] = []
	let count = 0
	for (const input of inputs) {
		let viewBox: string
		const svg = optimizeSVG(input.content, {
			...options,
			getViewBox(data) {
				viewBox = data
			}
		})
		result.push(formatTPL(tpl, svg, input.path, viewBox, options.removeRoot))
		count++
	}
	return result
}

function formatTPL(tpl: string, content: string, path: string, viewBox?: string, remoteRoot?: boolean) {
	return tpl.replace(/\$\w+/g, all => {
		switch (all) {
			case "$svg":
				return content
			case "$string":
				return `\`${content.replace(/[\`$]/g, "\\$&")}\``
			case "$path":
				return path
			case "$viewBox":
				return viewBox
			case "$markdown":
				const svg = content.replace(/"currentColor"/g, '"#D73A49"')
				return `![${getName(path, false)}](${encodeDataURI("image/svg+xml", remoteRoot ? `<svg xmlns="http://www.w3.org/2000/svg"${viewBox ? ` viewBox="${viewBox}"` : ""} height="2em" fill="#D73A49">${svg}</svg>` : svg.replace(/height=".*?"/, `height="2em"`))})`
			case "$name":
				return getName(path, false).replace(/[\-\.](\w)/g, (_, word: string) => word.toUpperCase())
		}
		return all
	})
}