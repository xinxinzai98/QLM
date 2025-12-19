/**
 * 请求帮助工具
 * 提供获取客户端IP地址等请求相关的工具函数
 */

/**
 * 获取客户端真实IP地址
 * 支持代理服务器（Nginx、Docker等）后的IP获取
 * @param {Object} req - Express请求对象
 * @returns {string} 客户端IP地址
 */
function getClientIP(req) {
    // 优先使用 x-forwarded-for 头（代理服务器设置）
    // x-forwarded-for 可能包含多个IP，格式：client, proxy1, proxy2
    // 取第一个IP（原始客户端IP）
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        const clientIP = ips[0].trim();
        if (clientIP) {
            return clientIP;
        }
    }

    // 使用 x-real-ip 头（Nginx常用）
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
        return realIP.trim();
    }

    // 使用 req.ip（需要 Express 配置 trust proxy）
    if (req.ip) {
        return req.ip;
    }

    // 使用 req.connection.remoteAddress（直接连接）
    if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress;
    }

    // 使用 req.socket.remoteAddress（备用）
    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }

    // 都无法获取时返回未知
    return 'unknown';
}

/**
 * 获取User-Agent
 * @param {Object} req - Express请求对象
 * @returns {string} User-Agent字符串
 */
function getUserAgent(req) {
    return req.headers['user-agent'] || '';
}

module.exports = {
    getClientIP,
    getUserAgent
};

