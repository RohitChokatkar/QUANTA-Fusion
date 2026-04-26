// Python FastAPI WebSocket client — live BSE tick streaming
const WS_BASE = import.meta.env.VITE_PYTHON_WS_URL || 'ws://localhost:8000';

type MessageHandler = (data: any) => void;

class PythonWSClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectDelay = 1000;
    private maxReconnectDelay = 30000;
    private handlers: Map<string, MessageHandler[]> = new Map();
    private shouldReconnect = true;

    constructor() {
        this.url = `${WS_BASE}/ws/live`;
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[WS] Connected to Python backend');
                this.reconnectDelay = 1000;
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    const type = msg.type || 'unknown';
                    const handlers = this.handlers.get(type) || [];
                    handlers.forEach(h => h(msg.data));
                    // Also fire 'any' handlers
                    (this.handlers.get('any') || []).forEach(h => h(msg));
                } catch (e) {
                    console.warn('[WS] Parse error:', e);
                }
            };

            this.ws.onclose = () => {
                if (this.shouldReconnect) {
                    setTimeout(() => this.connect(), this.reconnectDelay);
                    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
                }
            };

            this.ws.onerror = () => {
                // onclose will handle reconnect
            };
        } catch {
            // Backend may not be running
        }
    }

    on(type: string, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);
    }

    off(type: string, handler: MessageHandler) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx >= 0) handlers.splice(idx, 1);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        this.ws?.close();
        this.ws = null;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const pythonWS = new PythonWSClient();
export default pythonWS;
