module.exports = class Telegram extends require("./template.js") {
	#token;
	#chatId;
	#disableNotification;
	#active = false;

	constructor () {
		super();

		const config = app.Config.get("telegram");
		if (config.enabled !== true) {
			app.Logger.warn("Telegram", "Telegram is disabled, skipping telegram notifications");
			return;
		}
		
		const { chatId, token, disableNotification } = config;
		if (typeof chatId !== "number") {
			throw new app.Error({
				message: "Invalid chatId provided",
				args: { chatId }
			});
		}
		else if (typeof token !== "string") {
			throw new app.Error({
				message: "Invalid token provided",
				args: { token }
			});
		}
		else if (typeof disableNotification !== "boolean") {
			throw new app.Error({
				message: "Invalid disableNotification provided",
				args: { disableNotification }
			});
		}

		app.Logger.info("Telegram", "Telegram initialized");

		this.#active = true;
		this.#token = token;
		this.#chatId = chatId;
		this.#disableNotification = disableNotification;
	}

	async send (message) {
		if (!this.active) {
			throw new app.Error({
				message: "Telegram is not active"
			});
		}
		else if (typeof message !== "string") {
			throw new app.Error({
				message: "Provided message is not a string",
				args: {
					message: {
						type: typeof message,
						constructor: message?.constructor?.name ?? "N/A"
					}
				}
			});
		}

		try {
			const res = await app.Got({
				url: `https://api.telegram.org/bot${this.#token}/sendMessage`,
				method: "POST",
				responseType: "json",
				throwHttpErrors: false,
				json: {
					chat_id: this.#chatId,
					text: message,
					parse_mode: "MarkdownV2",
					disable_notification: this.#disableNotification
				}
			});
	
			if (res.body.ok !== true) {
				throw new app.Error({
					message: "Failed to send telegram message",
					args: {
						statusCode: res.statusCode,
						statusMessage: res.statusMessage,
						body: res.body
					}
				});
			}
	
			return true;
		}
		catch (e) {
			app.Logger.error("Telegram", e);
			return false;
		}
	}

	async handleMessage (messageData, options = {}) {
		if (!this.active) {
			throw new app.Error({
				message: "Telegram is not active"
			});
		}
		
		const message = this.prepareMessage(messageData, options);
		if (message) {
			return message;
		}
	}

	get active () { return this.#active; }
};
