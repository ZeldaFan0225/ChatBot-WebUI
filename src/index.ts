import { readFileSync, existsSync } from "fs";
import fastify, { FastifyRequest } from "fastify";
import rate_limit from "@fastify/rate-limit"
import cors from "@fastify/cors"
import fastify_static from "@fastify/static"
import cookie from "@fastify/cookie"
import { randomBytes } from "crypto";
import { join } from "path";
import { ChatCompletionRequest, Config } from "./types";
import { BaseConnector } from "./classes/BaseConnector";

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;

if (existsSync(`${process.cwd()}/.env`)) {
	for (const line of readFileSync(`${process.cwd()}/.env`, "utf8").split(
		/[\r\n]|\r\n/
	)) {
		let [, key, value] = line.match(RE_INI_KEY_VAL) || [];
		if (!key || !value) continue;

		process.env[key] = value?.trim();
	}
}

const config: Config = JSON.parse(readFileSync("./config.json").toString())
const models: Record<string, BaseConnector> = {}
const systemInstructions: Record<string, string> = {}

Object.entries(config.modelConfigurations).forEach(([name, data]) => {
    const connectorPath = config.connectors[data.connector]
    if(!connectorPath) throw new Error(`Connector ${data.connector} not found`)

    if(!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error("Name has to follow the regex: /^[a-zA-Z0-9_-]+$/")

    const connectorClass = require(join(__dirname, connectorPath + ".js"))
    const connector = new connectorClass.default(data.connectorOptions)
    connector.displayName = data.displayName
    models[name] = connector
    systemInstructions[name] = data.systemInstruction
})

console.log(`Loaded models: ${Object.keys(models).join(", ")}`)

const authenticated = new Set()

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

    app.get("/login", async (req, rep) => {
        console.log(process.env["LOGIN_USERNAME"],
        process.env["LOGIN_PASSWORD"])
        if(
            process.env["LOGIN_USERNAME"] &&
            process.env["LOGIN_PASSWORD"]
        ) {
            if(!req.headers.authorization) return rep.code(401).header("www-authenticate", "Basic").send({error: "Unauthorized"})
            const [username, password] = Buffer.from((req.headers.authorization || "").replace("Basic ", ""), "base64").toString("utf8").split(":")
            if(
                username !== process.env["LOGIN_USERNAME"] ||
                password !== process.env["LOGIN_PASSWORD"]
            ) return rep.code(401).header("www-authenticate", "Basic").send({error: "Unauthorized"})
            const token = randomBytes(32).toString("hex")
            authenticated.add(token)

            return rep.cookie("S_TOKEN", token).redirect("/")
        } else {
            return rep.redirect("/")
        }
    })

    app.get("/", async (req, rep) => {
        if(!checkIfAuthorized(req)) return rep.redirect("/login")
        return rep.sendFile("views/chat.html")
    })

    app.get("/api/models", async (req, rep) => {
        if(!checkIfAuthorized(req)) return rep.code(401).send({error: "Unauthorized"})
        const data: Record<string, any> = {}
        Object.entries(models).forEach(([name, model]) => {
            data[name] = {
                displayName: model.displayName,
                generationOptions: model.generationOptions,
                systemInstruction: systemInstructions[name]
            }
        })

        return rep.send(data)
    })

    app.post("/api/completion", {
        bodyLimit: 1024 * 1024 * 10
    }, async (req, rep) => {
        if(!checkIfAuthorized(req)) return rep.code(401).send({error: "Unauthorized"})
        const body = req.body as ChatCompletionRequest
        if(!body.model) return rep.code(400).send({error: "No model specified"})
        if(!body.messages) return rep.code(400).send({error: "No messages specified"})
        if(!models[body.model]) return rep.code(400).send({error: "Model not found"})
        const result = await models[body.model]?.requestChatCompletion(body.messages, body.overrideOptions || {})

        return rep.send({result})
    })

    app.setNotFoundHandler(function (_, reply) {
        reply.code(404).send({error: "Not Found"})
    })
    
    app.listen({port: Number(process.env["DASHBOARD_PORT"] || 3000), host: process.env["MODE"] === "dev" ? "localhost" : "0.0.0.0"}, (_err, address) => {
        console.log(`${app.printRoutes()}\n\nOnline at: ${address}`)
    })
}

function checkIfAuthorized(request: FastifyRequest) {
    if(
        process.env["LOGIN_USERNAME"] &&
        process.env["LOGIN_PASSWORD"]
    ) {
        if(!request.cookies["S_TOKEN"] || !authenticated.has(request.cookies["S_TOKEN"])) return false
    }

    return true
}