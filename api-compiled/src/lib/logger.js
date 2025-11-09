"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Production-safe logging utility
const isDevelopment = (typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : false);
exports.logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        console.warn(...args);
    },
    error: (...args) => {
        console.error(...args);
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    }
};
