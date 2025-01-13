import * as client from "openid-client";

const server = new URL("https://integrate.us.mixtelematics.com"); // Authorization Server's Issuer Identifier
const clientId = "mixbrraposo"; // Client identifier at the Authorization Server
const clientSecret = "jf4ssFckJXV06nQf"; // Client Secret

const execute = async () => {
	const config = await client.discovery(server, clientId, clientSecret);

	console.log(config);
};

execute();
