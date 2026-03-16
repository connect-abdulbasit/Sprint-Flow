const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";

if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable. Set JWT_SECRET in your .env file.");
}

export type AuthPayload = {
    sub: string;
    email: string;
    name: string;
    exp?: number;
};

function base64UrlEncode(input: string | Uint8Array) {
    const buffer = typeof input === "string" ? new TextEncoder().encode(input) : input;

    const base64 =
        typeof Buffer !== "undefined"
            ? Buffer.from(buffer).toString("base64")
            : btoa(String.fromCharCode(...buffer));

    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string) {
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

    if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64");
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function hmacSha256(key: string, data: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );

    const signature = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    return base64UrlEncode(new Uint8Array(signature));
}

export async function signAccessToken(user: { id: string; email: string; name: string }) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = parseDuration(ACCESS_TOKEN_EXPIRES_IN);

    const payload: AuthPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: now + expiresInSeconds,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const signature = await hmacSha256(JWT_SECRET!, unsigned);

    return `${unsigned}.${signature}`;
}

export async function verifyAccessToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid JWT");
    }

    const [headerB64, payloadB64, signature] = parts;
    const unsigned = `${headerB64}.${payloadB64}`;
    const expected = await hmacSha256(JWT_SECRET!, unsigned);

    if (!constantTimeEquals(signature, expected)) {
        throw new Error("Invalid signature");
    }

    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as AuthPayload;

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        throw new Error("Token expired");
    }

    return payload;
}

function constantTimeEquals(a: string, b: string) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

function parseDuration(duration: string) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 60 * 15;

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
        case "s":
            return value;
        case "m":
            return value * 60;
        case "h":
            return value * 60 * 60;
        case "d":
            return value * 60 * 60 * 24;
        default:
            return value;
    }
}
