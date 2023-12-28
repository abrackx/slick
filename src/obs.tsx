import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();

const setupObsWebSocket = async (url: string, password: string) => {
    try {
        const {
            obsWebSocketVersion,
            negotiatedRpcVersion
        } = await obs.connect(url, password, {
            rpcVersion: 1
        });
        console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
        return obs
    } catch (error) {
        // @ts-ignore
        console.error('Failed to connect', error.code, error.message);
    }
};
export default setupObsWebSocket
