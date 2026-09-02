"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFirestore = exports.adminAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
function initAdmin() {
    const existing = (0, app_1.getApps)();
    if (existing.length > 0)
        return existing[0];
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Missing Firebase Admin credentials. " +
            "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env");
    }
    return (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({ projectId, clientEmail, privateKey }),
    });
}
const app = initAdmin();
exports.adminAuth = (0, auth_1.getAuth)(app);
exports.adminFirestore = (0, firestore_1.getFirestore)(app);
//# sourceMappingURL=firebase-admin.js.map