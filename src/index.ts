import { readFileSync, existsSync } from "fs";
import fastify from "fastify";
import rate_limit from "@fastify/rate-limit"
import cors from "@fastify/cors"
import fastify_static from "@fastify/static"
import cookie from "@fastify/cookie"
import { join } from "path";
import { ChatCompletionRequest, Config } from "./types";
import { BaseConnector } from "./classes/BaseConnector";

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;

if (existsSync(`${process.cwd()}/.env`))
	for (const line of readFileSync(`${process.cwd()}/.env`, "utf8").split(
		/[\r\n]|\r\n/
	)) {
		let [, key, value] = line.match(RE_INI_KEY_VAL) || [];
		if (!key) continue;

		process.env[key] = value?.trim() || "true";
	}


const config: Config = JSON.parse(readFileSync("./config.json").toString())
const models: Record<string, BaseConnector> = {}

Object.entries(config.model_configurations).forEach(([name, data]) => {
    const connectorPath = config.connectors[data.connector]
    if(!connectorPath) throw new Error(`Connector ${data.connector} not found`)

    const connectorClass = require(join(__dirname, connectorPath + ".js"))
    models[name] = new connectorClass.default(data.connectorOptions)
})

console.log(`Loaded models: ${Object.keys(models).join(", ")}`)

startWebServer()
async function startWebServer() {
	const app = fastify({
		ignoreTrailingSlash: true,
		bodyLimit: 1024
	})
	
	await app.register(rate_limit, {
		timeWindow: '1 minute',
		max: 200,
	});
	
	await app.register(cors, {
		origin: process.env["MODE"] == "prod" ? process.env["DOMAIN"]! : '*',
	});

    await app.register(fastify_static, {
        root: join(__dirname, '../public')
    });
    
    await app.register(cookie)

    app.get("/chat", async (_, rep) => {
        return rep.sendFile("views/chat.html")
    })

    app.post("/api/completion", async (req, rep) => {
        const body = req.body as ChatCompletionRequest
        if(!body.model) return rep.code(400).send({error: "No model specified"})
        if(!body.messages) return rep.code(400).send({error: "No messages specified"})
        if(!models[body.model]) return rep.code(400).send({error: "Model not found"})
        const result = await models[body.model]?.requestChatCompletion(body.messages).catch(console.error)
        if(!result) return rep.code(500).send({error: "Internal Server Error"})

        return rep.send({result})
    })

    app.setNotFoundHandler(function (_, reply) {
        reply.code(404).send({error: "Not Found"})
    })
    
    app.listen({port: Number(process.env["DASHBOARD_PORT"] || 3000), host: process.env["MODE"] === "dev" ? "localhost" : "0.0.0.0"}, (_err, address) => {
        console.log(`${app.printRoutes()}\n\nOnline at: ${address}`)
    })
}