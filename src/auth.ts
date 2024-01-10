import OBSWebSocket from "obs-websocket-js";

interface ObsProvider {
    isConnected: boolean;
    connection: null | OBSWebSocket;
    version: string;

    signin(url: string, password: string): Promise<void>;

    signout(): Promise<void>;
}

/**
 * This represents some generic auth provider API, like Firebase.
 */
export const obsProvider: ObsProvider = {
    isConnected: false,
    connection: null,
    version: "unknown",
    async signin(url: string, password: string) {
        const obs = new OBSWebSocket();
        try {
            const {
                obsWebSocketVersion,
                negotiatedRpcVersion
            } = await obs.connect(url, password, {
                rpcVersion: 1
            });
            console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
            obsProvider.connection = obs
            obsProvider.isConnected = true
            const {obsVersion} = await obs.call("GetVersion")
            obsProvider.version = obsVersion
        } catch (error) {
            // @ts-ignore
            console.error('Failed to connect', error.code, error.message);
        }
    },
    async signout() {
        await new Promise((r) => setTimeout(r, 500)); // fake delay
        obsProvider.isConnected = false;
    },
};