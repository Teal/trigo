import { optimize, OptimizedSvg, Plugin } from "svgo"
import SvgPath = require("svgpath")

/**
 * 优化一个 SVG 文件
 * @param svg 要优化的 SVG 源码
 * @param options 优化选项
 */
export function optimizeSVG(svg: string, options: OptimizeSVGOptions = { min: true }): string {
	const plugins: Plugin[] = []
	if (options.removeTitle) {
		plugins.push("removeTitle")
		plugins.push({
			name: "keepTitle",
			type: "perItem",
			fn(node: any) {
				if (node.attributes?.title) {
					node.children.push({
						type: 'element',
						name: 'title',
						attributes: {},
						children: [
							{
								type: 'text',
								value: node.attributes.title
							}
						]
					})
					delete node.attributes.title
				}
			}
		})
	}
	if (options.removeColor) {
		plugins.push({
			name: "removeColor",
			type: "perItem",
			fn(node: any) {
				if (node.attributes) {
					if (node.attributes.fill && /^#/.test(node.attributes.fill)) {
						node.attributes.fill = "currentColor"
					}
					if (node.attributes.stroke && /^#/.test(node.attributes.stroke)) {
						node.attributes.stroke = "currentColor"
					}
				}
			}
		})
	}
	if (options.height || options.minWidth || options.offsetY || options.offsetX) {
		plugins.push(translate(options.height, options.minWidth, options.offsetY, options.offsetX))
	}
	if (options.removeAttrs) {
		plugins.push({
			name: "removeAttrs",
			params: {
				attrs: options.removeAttrs
			}
		})
	}
	if (options.min) {
		plugins.push(
			"cleanupAttrs",
			"removeDoctype",
			"removeXMLProcInst",
			"removeComments",
			"removeMetadata",
			"removeDesc",
			"removeUselessDefs",
			"removeEditorsNSData",
			"removeEmptyAttrs",
			"removeHiddenElems",
			"removeEmptyText",
			"removeEmptyContainers",
			"cleanupEnableBackground",
			"convertStyleToAttrs",
			"convertColors",
			"convertPathData",
			"convertTransform",
			"removeUnknownsAndDefaults",
			"removeNonInheritableGroupAttrs",
			// "removeUselessStrokeAndFill",
			"removeUnusedNS",
			"cleanupIDs",
			"cleanupNumericValues",
			"moveElemsAttrsToGroup",
			"moveGroupAttrsToElems",
			"collapseGroups",
			"removeRasterImages",
			"mergePaths",
			"convertShapeToPath",
			"convertEllipseToCircle",
			"sortAttrs",
			"removeDimensions",
		)
	}
	if (options.removeRoot) {
		plugins.push({
			name: "cleanRoot",
			type: "full",
			fn(node: any) {
				if (node.type === "root") {
					if (node.children && node.children.length === 1 && node.children[0].name === "svg") {
						if (options.getViewBox) {
							const viewBox = node.children[0].attributes?.viewBox
							viewBox && options.getViewBox(viewBox)
						}
						node.children = node.children[0].children
					} else if (node.content) {
						node.content = node.content[0].content
					}
				}
				return node
			}
		})
	} else if (options.min) {
		plugins.push({
			name: "cleanRoot",
			type: "perItem",
			fn(node: any) {
				if (
					node.isElem(["svg"]) &&
					!node.hasAttr("viewBox") &&
					node.hasAttr("width") &&
					node.hasAttr("height") &&
					node.attr("width").value.endsWith("px") &&
					node.attr("height").value.endsWith("px")
				) {
					const width = parseFloat(node.attr("width").value.replace(/px$/, ""))
					const height = parseFloat(node.attr("height").value.replace(/px$/, ""))
					node.removeAttr("width")
					node.removeAttr("height")
					const viewBox = `0 0 ${width} ${height}`
					node.addAttr({
						name: "viewBox",
						prefix: "",
						local: "viewBox",
						value: viewBox
					})
					options.getViewBox?.(viewBox)
				}
			}
		})
	}
	const result = optimize(svg, {
		full: true,
		plugins: plugins
	}) as OptimizedSvg
	return result.data
}

/** 表示优化的选项 */
export interface OptimizeSVGOptions {
	/** 是否压缩 */
	min?: boolean
	/** 删除指定属性 */
	removeAttrs?: string | string[]
	/** 删除根节点 */
	removeRoot?: boolean
	/** 删除颜色值 */
	removeColor?: boolean
	/** 删除 `<title>` 节点 */
	removeTitle?: boolean
	/** 获取 viewBox 的回调函数 */
	getViewBox?(viewBox: string): void
	/** 转换后的高度，宽度将根据当前比例自动缩放 */
	height?: number
	/** 最小宽度 */
	minWidth?: number
	/** 垂直的偏移 */
	offsetY?: number
	/** 水平的偏移 */
	offsetX?: number
}

/**
 * SVGO 插件：缩放或偏移 SVG
 * @param height 转换后的高度，宽度将根据当前比例自动缩放
 * @param minWidth 最小宽度
 * @param offsetY 垂直的偏移
 * @param offsetX 水平的偏移
 */
export function translate(height = 0, minWidth = 0, offsetY = 0, offsetX = 0) {
	const context = {
		scale: 1,
		offsetX: 0,
		offsetY: 0
	}
	return {
		name: translate.name,
		type: "perItem",
		fn(node: any) {
			if (!node.attributes) {
				return
			}
			switch (node.name) {
				case "svg":
				case "symbol":
					let originalX = 0
					let originalY = 0
					let originalWidth = 0
					let originalHeight = 0
					if (node.attributes.viewBox) {
						const parts = node.attributes.viewBox.split(/\s+/)
						originalX = +parts[0]
						originalY = +parts[1]
						originalWidth = +parts[2]
						originalHeight = +parts[3]
					} else {
						originalWidth = parseFloat(node.attributes.width) || height
						originalHeight = parseFloat(node.attributes.height) || height
					}
					context.offsetX = -originalX + offsetX
					context.offsetY = -originalY + offsetY
					context.scale = height / originalHeight
					let width = Math.round(originalWidth * context.scale * 10000) / 10000
					if (width < minWidth) {
						context.offsetX += (minWidth - width) / 2
						width = minWidth
					} else {
						width = Math.round(originalWidth * context.scale * 10000) / 10000
					}
					node.attributes.viewBox = [
						0,
						0,
						width,
						height
					].join(" ")
					break
				case "path":
					node.attributes.d = new SvgPath(node.attributes.d)
						.translate(context.offsetX, context.offsetY)
						.scale(context.scale)
						.abs()
						.round(1)
						.rel()
						.round(1)
						.toString()
					break
				case "rect":
				case "line":
				case "circle":
				case "ellipse":
					const dxAttrs = ["cx", "x", "x1", "x2"]
					const dyAttrs = ["cy", "y", "y1", "y2"]
					const scaleAttrs = ["width", "height", "rx", "ry", "r", ...dxAttrs, ...dyAttrs]
					for (const attrKey in node.attributes) {
						if (scaleAttrs.indexOf(attrKey) > -1) {
							node.attributes[attrKey] = (node.attributes[attrKey] * context.scale).toString()
						}
						if (dxAttrs.indexOf(attrKey) > -1) {
							node.attributes[attrKey] = (+node.attributes[attrKey] + context.offsetX).toString()
						}
						if (dyAttrs.indexOf(attrKey) > -1) {
							node.attributes[attrKey] = (+node.attributes[attrKey] + context.offsetY).toString()
						}
					}
					break
				case "polyline":
				case "polygon":
					node.attributes.points = (node.attributes.points || "").trim()
						.split(/\s+/)
						.map((point: any) => {
							const pair = point.split(",")
							pair[0] = +pair[0] * context.scale + context.offsetX
							pair[1] = +pair[1] * context.scale + context.offsetY
							return pair.join(",")
						})
						.join(" ")
					break
			}
			if (node.attributes.transform) {
				node.attributes.transform = node.attributes.transform.replace(/(matrix\([\+\-\d\.]+[\s,]+[\+\-\d\.]+[\s,]+[\+\-\d\.]+[\s,]+[\+\-\d\.]+[\s,]+|translate\()([\+\-\d\.]+)([\s,]+)([\+\-\d\.]+)\)/g, (all: string, prefix: string, tx: string, comma: string, ty: string) => {
					return `${prefix}${+tx * context.scale}${comma}${+ty * context.scale})`
				})
			}
		}
	} as Plugin
}