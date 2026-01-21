/**
 * MediaCrawler WebUI - Main Application
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    App.init();
});

const App = {
    // State
    state: {
        status: 'idle',
        keywords: [],
        logs: [],
    },

    // DOM Elements
    elements: {},

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initWebSocket();
        this.loadInitialState();
    },

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Status
            statusIndicator: document.getElementById('statusIndicator'),

            // Config inputs
            platform: document.getElementById('platform'),
            crawlerType: document.getElementById('crawlerType'),
            startPage: document.getElementById('startPage'),
            keywords: document.getElementById('keywords'),
            keywordsTags: document.getElementById('keywordsTags'),
            specifiedIds: document.getElementById('specifiedIds'),
            creatorIds: document.getElementById('creatorIds'),
            minTime: document.getElementById('minTime'),
            ipLocation: document.getElementById('ipLocation'),
            loginType: document.getElementById('loginType'),
            cookies: document.getElementById('cookies'),
            saveOption: document.getElementById('saveOption'),
            enableComments: document.getElementById('enableComments'),
            enableSubComments: document.getElementById('enableSubComments'),
            headless: document.getElementById('headless'),

            // Groups
            keywordsGroup: document.getElementById('keywordsGroup'),
            specifiedIdsGroup: document.getElementById('specifiedIdsGroup'),
            creatorIdsGroup: document.getElementById('creatorIdsGroup'),
            cookiesGroup: document.getElementById('cookiesGroup'),

            // Buttons
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearLogsBtn: document.getElementById('clearLogsBtn'),

            // Logs
            logContainer: document.getElementById('logContainer'),
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Crawler type change
        this.elements.crawlerType.addEventListener('change', () => this.updateCrawlerTypeUI());

        // Login type change
        this.elements.loginType.addEventListener('change', () => this.updateLoginTypeUI());

        // Keywords input
        this.elements.keywords.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addKeyword();
            }
        });

        // Sub-comments dependency
        this.elements.enableComments.addEventListener('change', () => {
            if (!this.elements.enableComments.checked) {
                this.elements.enableSubComments.checked = false;
            }
        });

        // Action buttons
        this.elements.startBtn.addEventListener('click', () => this.startCrawler());
        this.elements.stopBtn.addEventListener('click', () => this.stopCrawler());
        this.elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());
    },

    /**
     * Initialize WebSocket connection
     */
    initWebSocket() {
        window.logWebSocket.onLog((log) => {
            this.addLogEntry(log);
        });

        window.logWebSocket.onStatus((status) => {
            this.updateStatus(status.status);
        });

        window.logWebSocket.connect();
    },

    /**
     * Load initial state from server
     */
    async loadInitialState() {
        try {
            // Get current status
            const statusData = await window.api.getStatus();
            this.updateStatus(statusData.status);

            // Get existing logs
            const logsData = await window.api.getLogs(100);
            if (logsData.logs && logsData.logs.length > 0) {
                this.elements.logContainer.innerHTML = '';
                logsData.logs.forEach(log => this.addLogEntry(log));
            }
        } catch (e) {
            console.error('Failed to load initial state:', e);
        }
    },

    /**
     * Update UI based on crawler type
     */
    updateCrawlerTypeUI() {
        const type = this.elements.crawlerType.value;

        this.elements.keywordsGroup.classList.toggle('hidden', type !== 'search');
        this.elements.specifiedIdsGroup.classList.toggle('hidden', type !== 'detail');
        this.elements.creatorIdsGroup.classList.toggle('hidden', type !== 'creator');
    },

    /**
     * Update UI based on login type
     */
    updateLoginTypeUI() {
        const type = this.elements.loginType.value;
        this.elements.cookiesGroup.classList.toggle('hidden', type !== 'cookie');
    },

    /**
     * Add a keyword tag
     */
    addKeyword() {
        const input = this.elements.keywords;
        const value = input.value.trim();

        if (value && !this.state.keywords.includes(value)) {
            this.state.keywords.push(value);
            this.renderKeywordTags();
        }

        input.value = '';
    },

    /**
     * Remove a keyword tag
     */
    removeKeyword(keyword) {
        this.state.keywords = this.state.keywords.filter(k => k !== keyword);
        this.renderKeywordTags();
    },

    /**
     * Render keyword tags
     */
    renderKeywordTags() {
        const container = this.elements.keywordsTags;
        container.innerHTML = '';

        this.state.keywords.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `
                ${this.escapeHtml(keyword)}
                <span class="tag-remove" onclick="App.removeKeyword('${this.escapeHtml(keyword)}')">×</span>
            `;
            container.appendChild(tag);
        });
    },

    /**
     * Update status indicator
     */
    updateStatus(status) {
        this.state.status = status;
        const indicator = this.elements.statusIndicator;

        // Remove all status classes
        indicator.classList.remove('idle', 'running', 'stopping', 'error');
        indicator.classList.add(status);

        // Update text
        const statusTexts = {
            idle: '待机中',
            running: '运行中',
            stopping: '停止中',
            error: '错误',
        };
        indicator.querySelector('.status-text').textContent = statusTexts[status] || status;

        // Update button visibility
        const isRunning = status === 'running';
        const isStopping = status === 'stopping';

        this.elements.startBtn.classList.toggle('hidden', isRunning || isStopping);
        this.elements.stopBtn.classList.toggle('hidden', !isRunning);
        this.elements.stopBtn.disabled = isStopping;

        // Disable/enable config inputs
        this.setConfigDisabled(isRunning || isStopping);
    },

    /**
     * Enable/disable config inputs
     */
    setConfigDisabled(disabled) {
        const inputs = [
            'platform', 'crawlerType', 'startPage', 'keywords',
            'specifiedIds', 'creatorIds', 'minTime', 'ipLocation',
            'loginType', 'cookies', 'saveOption',
            'enableComments', 'enableSubComments', 'headless'
        ];

        inputs.forEach(id => {
            const el = this.elements[id];
            if (el) el.disabled = disabled;
        });
    },

    /**
     * Build configuration object from form
     */
    buildConfig() {
        const minTimeValue = this.elements.minTime.value;
        // Convert date input (YYYY-MM-DD) to our format
        const minTimeStr = minTimeValue ? minTimeValue : '';

        return {
            platform: this.elements.platform.value,
            login_type: this.elements.loginType.value,
            crawler_type: this.elements.crawlerType.value,
            keywords: this.state.keywords.join(','),
            specified_ids: this.elements.specifiedIds.value.trim(),
            creator_ids: this.elements.creatorIds.value.trim(),
            start_page: parseInt(this.elements.startPage.value) || 1,
            enable_comments: this.elements.enableComments.checked,
            enable_sub_comments: this.elements.enableSubComments.checked,
            save_option: this.elements.saveOption.value,
            cookies: this.elements.cookies.value.trim(),
            headless: this.elements.headless.checked,
            min_time: minTimeStr,
            ip_location: this.elements.ipLocation.value.trim(),
        };
    },

    /**
     * Start the crawler
     */
    async startCrawler() {
        const config = this.buildConfig();

        // Validation
        if (config.crawler_type === 'search' && !config.keywords) {
            this.showError('请输入搜索关键词');
            return;
        }

        if (config.crawler_type === 'detail' && !config.specified_ids) {
            this.showError('请输入帖子/视频ID');
            return;
        }

        if (config.crawler_type === 'creator' && !config.creator_ids) {
            this.showError('请输入创作者ID');
            return;
        }

        if (config.login_type === 'cookie' && !config.cookies) {
            this.showError('请输入Cookie');
            return;
        }

        this.elements.startBtn.disabled = true;

        try {
            await window.api.startCrawler(config);
            this.updateStatus('running');
            this.addLogEntry({
                timestamp: this.getCurrentTime(),
                level: 'success',
                message: '爬虫启动成功',
            });
        } catch (e) {
            this.showError(e.message);
            this.elements.startBtn.disabled = false;
        }
    },

    /**
     * Stop the crawler
     */
    async stopCrawler() {
        this.elements.stopBtn.disabled = true;
        this.updateStatus('stopping');

        try {
            await window.api.stopCrawler();
            this.addLogEntry({
                timestamp: this.getCurrentTime(),
                level: 'warning',
                message: '正在停止爬虫...',
            });
        } catch (e) {
            this.showError(e.message);
            this.elements.stopBtn.disabled = false;
        }
    },

    /**
     * Add a log entry to the container
     */
    addLogEntry(log) {
        const container = this.elements.logContainer;

        // Remove placeholder if exists
        const placeholder = container.querySelector('.log-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const level = log.level || 'info';
        const levelLabels = {
            info: 'INFO',
            success: '成功',
            warning: '警告',
            error: '错误',
            debug: 'DEBUG'
        };

        const entry = document.createElement('div');
        entry.className = `log-entry ${level}`;
        entry.innerHTML = `
            <span class="log-time">${log.timestamp}</span>
            <span class="log-level ${level}">${levelLabels[level] || level.toUpperCase()}</span>
            <span class="log-message">${this.escapeHtml(log.message)}</span>
        `;

        container.appendChild(entry);

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Keep only last 500 entries
        while (container.children.length > 500) {
            container.removeChild(container.firstChild);
        }
    },

    /**
     * Clear all logs
     */
    clearLogs() {
        this.elements.logContainer.innerHTML = '<div class="log-placeholder">等待任务开始...</div>';
        this.state.logs = [];
    },

    /**
     * Show error message
     */
    showError(message) {
        this.addLogEntry({
            timestamp: this.getCurrentTime(),
            level: 'error',
            message: message,
        });
    },

    /**
     * Get current time string
     */
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('zh-CN', { hour12: false });
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Poll for status updates (fallback if WebSocket fails)
     */
    startPolling() {
        setInterval(async () => {
            if (!window.logWebSocket.isConnected()) {
                try {
                    const statusData = await window.api.getStatus();
                    this.updateStatus(statusData.status);
                } catch (e) {
                    console.error('Status poll failed:', e);
                }
            }
        }, 3000);
    }
};
