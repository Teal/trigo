#!/usr/bin/env node
import { CommandLineOption, formatCommandLineOptions, parseCommandLineArguments } from "tutils/commandLine"
import { glob, readText, writeFile } from "tutils/fileSystemSync"
import trigo from "./trigo"

const commandLineOptions: { [option: string]: CommandLineOption } = {
	"--out": {
		argument: "path",
		alias: "-o",
		description: "Specific the output file path"
	},
	"--tpl": {
		argument: "content",
		description: "Specific the output template. Support variables: $name, $svg, $string, $path, $viewBox, $markdown"
	},
	"--postfix": {
		argument: "name",
		description: "Specific the variable name postfix"
	},
	"--height": {
		argument: "size",
		description: "Resize icons to specific height"
	},
	"--minWidth": {
		argument: "size",
		description: "Resize icons to specific width"
	},
	"--removeColor": {
		description: "Remove colors in svg"
	},
	"--removeTitle": {
		description: "Remove titles in svg"
	},
	"--removeRoot": {
		description: "Remove root in svg"
	},
	"--removeAttrs": {
		argument: "attrs",
		description: "Remove attributes in svg"
	},
	"--offsetX": {
		argument: "size",
		description: "translate icons horizontally"
	},
	"--offsetY": {
		argument: "size",
		description: "translate icons vertically"
	},
	"--version": {
		alias: ["-v", "-V"],
		description: "Print version"
	},
	"--help": {
		alias: ["-h", "-?"],
		description: "Print the message"
	}
}

const options = parseCommandLineArguments(commandLineOptions, undefined, process.argv, 2)
if (options["--version"]) {
	console.info(require("../package.json").version)
} else if (options["--help"]) {
	console.info(`Trigo v${require("../package.json").version}`)
	console.info(`Usage: trigo <input> [options]`)
	console.info("")
	console.info(`Options:`)
	console.info(formatCommandLineOptions(commandLineOptions))
} else {
	const inputs: string[] = []
	for (let i = 0; options[i]; i++) {
		inputs.push(options[i])
	}
	const tpl = options["--tpl"] || `/** $markdown */\nexport const $name${options["--postfix"] || ""} = $string`
	const result = trigo(glob(inputs).map(path => ({ path, content: readText(path) })), tpl, {
		min: options["--min"] ?? true,
		removeColor: options["--removeColor"] ?? false,
		removeTitle: options["--removeTitle"] ?? false,
		removeRoot: options["--removeRoot"] ?? false,
		height: +options["--height"] || undefined,
		minWidth: +options["--minWidth"] || undefined,
		offsetX: +options["--offsetX"] || undefined,
		offsetY: +options["--offsetY"] || undefined,
		removeAttrs: options["--removeAttrs"],
	})
	const outFile = options["--out"] || "icons.generated.ts"
	writeFile(outFile, result.join("\n\n"))
	console.info(`${result.length} icons generated successfully at ${outFile}`)
}