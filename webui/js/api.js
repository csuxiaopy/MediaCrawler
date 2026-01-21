/**
 * MediaCrawler WebUI - API Module
 * Handles all API calls to the backend
 */

const API_BASE = '/api';

const api = {
    /**
     * Start the crawler with given configuration
     */
    async startCrawler(config) {
        const response = await fetch(`${API_BASE}/crawler/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '启动爬虫失败');
        }

        return response.json();
    },

    /**
     * Stop the running crawler
     */
    async stopCrawler() {
        const response = await fetch(`${API_BASE}/crawler/stop`, {
            method: 'POST',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '停止爬虫失败');
        }

        return response.json();
    },

    /**
     * Get current crawler status
     */
    async getStatus() {
        const response = await fetch(`${API_BASE}/crawler/status`);

        if (!response.ok) {
            throw new Error('获取状态失败');
        }

        return response.json();
    },

    /**
     * Get recent logs
     */
    async getLogs(limit = 100) {
        const response = await fetch(`${API_BASE}/crawler/logs?limit=${limit}`);

        if (!response.ok) {
            throw new Error('获取日志失败');
        }

        return response.json();
    },

    /**
     * Get supported platforms
     */
    async getPlatforms() {
        const response = await fetch(`${API_BASE}/config/platforms`);

        if (!response.ok) {
            throw new Error('获取平台列表失败');
        }

        return response.json();
    },

    /**
     * Get configuration options
     */
    async getConfigOptions() {
        const response = await fetch(`${API_BASE}/config/options`);

        if (!response.ok) {
            throw new Error('获取配置选项失败');
        }

        return response.json();
    },

    /**
     * Check environment
     */
    async checkEnvironment() {
        const response = await fetch(`${API_BASE}/env/check`);

        if (!response.ok) {
            throw new Error('环境检查失败');
        }

        return response.json();
    },

    /**
     * Health check
     */
    async healthCheck() {
        const response = await fetch(`${API_BASE}/health`);
        return response.ok;
    }
};

// Export for use in other modules
window.api = api;
