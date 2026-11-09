import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const aliases = JSON.parse(process.env.JITI_ALIAS ?? "{}");
const redirected = new Set([
	"@earendil-works/pi-server",
	"@earendil-works/pi-server/unix",
	"@earendil-works/pi-tui",
]);

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (redirected.has(specifier) && aliases[specifier]) {
			return nextResolve(pathToFileURL(aliases[specifier]).href, context);
		}
		return nextResolve(specifier, context);
	},
});
