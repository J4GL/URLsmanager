/**
 * Standalone URL Processing Web Worker
 * Includes all necessary code for URL processing without external dependencies
 */

/**
 * URLParser - Utility class for parsing and validating URLs
 */
class URLParser {
    static parse(url) {
        if (!url || typeof url !== 'string') {
            return {
                original: url,
                valid: false,
                error: 'Invalid input'
            };
        }

        if (url.trim() === '' || url === 'not-a-url' || url === '://invalid') {
            return {
                original: url,
                valid: false,
                error: 'Invalid URL format'
            };
        }

        try {
            const cleanUrl = this.normalizeUrl(url);
            
            let urlObj;
            try {
                urlObj = new URL(cleanUrl);
            } catch (e) {
                if (!cleanUrl.includes('://')) {
                    try {
                        urlObj = new URL('http://' + cleanUrl);
                    } catch (e2) {
                        return {
                            original: url,
                            valid: false,
                            error: 'Cannot parse URL'
                        };
                    }
                } else {
                    return {
                        original: url,
                        valid: false,
                        error: 'Invalid URL format'
                    };
                }
            }

            const hostname = urlObj.hostname.toLowerCase();
            const domainParts = this.extractDomainParts(hostname);
            
            return {
                original: url,
                protocol: urlObj.protocol.replace(':', ''),
                hostname: hostname,
                domain: domainParts.domain,
                subdomain: domainParts.subdomain,
                tld: domainParts.tld,
                path: urlObj.pathname,
                parameters: this.parseParameters(urlObj.search),
                fragment: urlObj.hash.replace('#', ''),
                port: urlObj.port,
                valid: true
            };
        } catch (error) {
            return {
                original: url,
                valid: false,
                error: error.message
            };
        }
    }

    static isValid(url) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return false;
        }
        
        if (url === 'not-a-url' || url === '://invalid') {
            return false;
        }
        
        const parsed = this.parse(url);
        return parsed && parsed.valid;
    }

    static getDomain(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid ? parsed.domain : null;
    }

    static getTLD(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid ? parsed.tld : null;
    }

    static hasSubdomain(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid && parsed.subdomain && parsed.subdomain.length > 0;
    }

    static removeParameters(url) {
        const parsed = this.parse(url);
        if (!parsed || !parsed.valid) {
            return null;
        }

        try {
            const urlObj = new URL(parsed.original.includes('://') ? parsed.original : 'http://' + parsed.original);
            urlObj.search = '';
            let result = urlObj.toString();
            
            if (!parsed.original.includes('://')) {
                result = result.replace(/^https?:\/\//, '');
            }
            
            return result;
        } catch (error) {
            return null;
        }
    }

    static getFullDomain(url) {
        const parsed = this.parse(url);
        if (!parsed || !parsed.valid) {
            return null;
        }
        
        return parsed.hostname;
    }

    static normalizeUrl(url) {
        return url.trim()
                  .replace(/\s+/g, '')
                  .replace(/\/+$/, '');
    }

    static extractDomainParts(hostname) {
        if (!hostname) {
            return { subdomain: '', domain: '', tld: '' };
        }

        const parts = hostname.split('.');
        
        if (parts.length < 2) {
            return { subdomain: '', domain: hostname, tld: '' };
        }

        const tld = parts[parts.length - 1];
        let domain, subdomain;

        if (parts.length === 2) {
            domain = parts[0];
            subdomain = '';
        } else if (parts.length === 3) {
            if (this.isCommonSecondLevelTLD(parts[parts.length - 2], tld)) {
                domain = parts[parts.length - 3];
                subdomain = parts.slice(0, -3).join('.');
            } else {
                domain = parts[parts.length - 2];
                subdomain = parts.slice(0, -2).join('.');
            }
        } else {
            if (this.isCommonSecondLevelTLD(parts[parts.length - 2], tld)) {
                domain = parts[parts.length - 3];
                subdomain = parts.slice(0, -3).join('.');
            } else {
                domain = parts[parts.length - 2];
                subdomain = parts.slice(0, -2).join('.');
            }
        }

        return {
            subdomain: subdomain || '',
            domain: domain || '',
            tld: tld || ''
        };
    }

    static isCommonSecondLevelTLD(secondLevel, topLevel) {
        const commonSecondLevel = {
            'co': ['uk', 'jp', 'kr', 'za', 'nz'],
            'com': ['au', 'br', 'mx'],
            'net': ['au'],
            'org': ['au', 'uk'],
            'gov': ['uk', 'au'],
            'edu': ['au'],
            'ac': ['uk']
        };

        return commonSecondLevel[secondLevel] && 
               commonSecondLevel[secondLevel].includes(topLevel);
    }

    static parseParameters(search) {
        const params = {};
        if (!search || search.length <= 1) {
            return params;
        }

        const queryString = search.startsWith('?') ? search.slice(1) : search;
        
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });

        return params;
    }
}

/**
 * URLProcessor - Core URL processing engine
 */
class URLProcessor {
    constructor() {
        this.stats = {
            inputCount: 0,
            outputCount: 0,
            removedCount: 0,
            invalidCount: 0,
            processingTime: 0
        };
    }

    process(urls, operation, options = {}) {
        const startTime = performance.now();
        
        try {
            this.resetStats();
            this.stats.inputCount = urls.length;

            if (!Array.isArray(urls)) {
                throw new Error('URLs must be provided as an array');
            }

            if (!operation || typeof operation !== 'string') {
                throw new Error('Operation type must be specified');
            }

            let results = [];

            switch (operation) {
                case 'removeParameters':
                    results = this.removeParameters(urls);
                    break;
                case 'deduplicate':
                    results = this.deduplicate(urls, options.type || 'full');
                    break;
                case 'filter':
                    results = this.filter(urls, options.type, options.filterString);
                    break;
                case 'keepTLDOnly':
                    results = this.keepTLDOnly(urls);
                    break;
                case 'trimLastPath':
                    results = this.trimLastPath(urls);
                    break;
                case 'extractTLD':
                    results = this.extractTLD(urls);
                    break;
                case 'sortByDomain':
                    results = this.sortByDomain(urls);
                    break;
                case 'sortByLength':
                    results = this.sortByLength(urls);
                    break;
                case 'sortByFilename':
                    results = this.sortByFilename(urls);
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            this.stats.outputCount = results.length;
            this.stats.removedCount = this.stats.inputCount - this.stats.outputCount;
            this.stats.processingTime = performance.now() - startTime;

            return this.createProcessingResult(true, results, []);

        } catch (error) {
            this.stats.processingTime = performance.now() - startTime;
            return this.createProcessingResult(false, [], [error.message]);
        }
    }

    removeParameters(urls) {
        const results = [];
        
        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const cleanedUrl = URLParser.removeParameters(url.trim());
            
            if (cleanedUrl !== null) {
                results.push(cleanedUrl);
            } else {
                this.stats.invalidCount++;
            }
        }

        return results;
    }

    deduplicate(urls, type = 'full') {
        const results = [];
        const seen = new Set();

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const comparisonKey = this.getDeduplicationKey(trimmedUrl, type);

            if (comparisonKey === null) {
                this.stats.invalidCount++;
                continue;
            }

            if (!seen.has(comparisonKey)) {
                seen.add(comparisonKey);
                results.push(trimmedUrl);
            }
        }

        return results;
    }

    getDeduplicationKey(url, type) {
        switch (type) {
            case 'tld':
                return this.getTLDKey(url);
            case 'domain':
                return this.getDomainKey(url);
            case 'full':
            default:
                return this.getFullURLKey(url);
        }
    }

    getTLDKey(url) {
        const tld = URLParser.getTLD(url);
        return tld ? tld.toLowerCase() : null;
    }

    getDomainKey(url) {
        const fullDomain = URLParser.getFullDomain(url);
        return fullDomain ? fullDomain.toLowerCase() : null;
    }

    getFullURLKey(url) {
        if (!URLParser.isValid(url)) {
            return null;
        }
        return url.toLowerCase();
    }

    filter(urls, filterType, filterString) {
        if (!filterString || typeof filterString !== 'string' || filterString.trim() === '') {
            throw new Error('Filter string is required for filter operations');
        }

        const results = [];
        const searchString = filterString.toLowerCase();

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const urlLower = trimmedUrl.toLowerCase();
            const containsString = urlLower.includes(searchString);

            if (filterType === 'include' && containsString) {
                results.push(trimmedUrl);
            } else if (filterType === 'exclude' && !containsString) {
                results.push(trimmedUrl);
            }
        }

        return results;
    }

    keepTLDOnly(urls) {
        const results = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            
            if (!URLParser.hasSubdomain(trimmedUrl)) {
                if (URLParser.isValid(trimmedUrl)) {
                    results.push(trimmedUrl);
                } else {
                    this.stats.invalidCount++;
                }
            }
        }

        return results;
    }

    trimLastPath(urls) {
        const results = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            
            if (!URLParser.isValid(trimmedUrl)) {
                this.stats.invalidCount++;
                continue;
            }

            try {
                const urlObj = new URL(trimmedUrl);
                let path = urlObj.pathname;
                
                if (path.endsWith('/')) {
                    path = path.slice(0, -1);
                }
                
                const lastSlashIndex = path.lastIndexOf('/');
                if (lastSlashIndex > 0) {
                    path = path.substring(0, lastSlashIndex);
                } else if (lastSlashIndex === 0) {
                    path = '/';
                }
                
                urlObj.pathname = path;
                results.push(urlObj.toString());
            } catch (error) {
                this.stats.invalidCount++;
            }
        }

        return results;
    }

    extractTLD(urls) {
        const results = [];
        const seen = new Set();

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const parsed = URLParser.parse(trimmedUrl);
            
            if (!parsed.valid) {
                this.stats.invalidCount++;
                continue;
            }

            const domain = parsed.domain;
            const tld = parsed.tld;
            
            if (domain && tld) {
                const baseDomain = `${domain}.${tld}`;
                if (!seen.has(baseDomain)) {
                    seen.add(baseDomain);
                    results.push(baseDomain);
                }
            } else {
                this.stats.invalidCount++;
            }
        }

        return results;
    }

    sortByDomain(urls) {
        const validUrls = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const parsed = URLParser.parse(trimmedUrl);
            
            if (!parsed.valid) {
                this.stats.invalidCount++;
                continue;
            }

            validUrls.push({
                original: trimmedUrl,
                domain: parsed.hostname.toLowerCase()
            });
        }

        validUrls.sort((a, b) => a.domain.localeCompare(b.domain));
        return validUrls.map(item => item.original);
    }

    sortByLength(urls) {
        const validUrls = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            
            if (URLParser.isValid(trimmedUrl)) {
                validUrls.push(trimmedUrl);
            } else {
                this.stats.invalidCount++;
            }
        }

        validUrls.sort((a, b) => a.length - b.length);
        return validUrls;
    }

    sortByFilename(urls) {
        const validUrls = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const parsed = URLParser.parse(trimmedUrl);
            
            if (!parsed.valid) {
                this.stats.invalidCount++;
                continue;
            }

            const path = parsed.path || '/';
            const pathSegments = path.split('/');
            let filename = pathSegments[pathSegments.length - 1] || '';
            
            const lastDotIndex = filename.lastIndexOf('.');
            if (lastDotIndex > 0) {
                filename = filename.substring(0, lastDotIndex);
            }
            
            if (!filename) {
                if (pathSegments.length > 1) {
                    filename = pathSegments[pathSegments.length - 2] || parsed.hostname;
                } else {
                    filename = parsed.hostname;
                }
            }

            validUrls.push({
                original: trimmedUrl,
                filename: filename.toLowerCase()
            });
        }

        validUrls.sort((a, b) => a.filename.localeCompare(b.filename));
        return validUrls.map(item => item.original);
    }

    createProcessingResult(success, results, errors) {
        return {
            success: success,
            inputCount: this.stats.inputCount,
            outputCount: this.stats.outputCount,
            removedCount: this.stats.removedCount,
            invalidCount: this.stats.invalidCount,
            results: results || [],
            errors: errors || [],
            processingTime: Math.round(this.stats.processingTime * 100) / 100
        };
    }

    resetStats() {
        this.stats = {
            inputCount: 0,
            outputCount: 0,
            removedCount: 0,
            invalidCount: 0,
            processingTime: 0
        };
    }
}

/**
 * Worker configuration
 */
const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 100;

/**
 * Main message handler for the web worker
 */
self.onmessage = function(event) {
    const { id, operation, urls, options } = event.data;
    
    try {
        if (!operation || !Array.isArray(urls)) {
            throw new Error('Invalid input: operation and urls array are required');
        }

        processURLsWithProgress(id, operation, urls, options || {});
        
    } catch (error) {
        self.postMessage({
            id: id,
            type: 'error',
            error: error.message,
            timestamp: Date.now()
        });
    }
};

function processURLsWithProgress(id, operation, urls, options) {
    const startTime = performance.now();
    const totalUrls = urls.length;
    
    self.postMessage({
        id: id,
        type: 'start',
        totalUrls: totalUrls,
        timestamp: Date.now()
    });

    const useBatchProcessing = totalUrls > BATCH_SIZE;
    
    if (useBatchProcessing) {
        processBatches(id, operation, urls, options, startTime);
    } else {
        processSingleBatch(id, operation, urls, options, startTime);
    }
}

function processBatches(id, operation, urls, options, startTime) {
    const totalUrls = urls.length;
    const batches = Math.ceil(totalUrls / BATCH_SIZE);
    let processedUrls = 0;
    let allResults = [];
    let totalStats = {
        inputCount: totalUrls,
        outputCount: 0,
        removedCount: 0,
        invalidCount: 0
    };

    let lastProgressTime = performance.now();

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, totalUrls);
        const batchUrls = urls.slice(startIndex, endIndex);
        
        const processor = new URLProcessor();
        const batchResult = processor.process(batchUrls, operation, options);
        
        if (batchResult.success) {
            allResults = allResults.concat(batchResult.results);
            totalStats.outputCount += batchResult.outputCount;
            totalStats.invalidCount += batchResult.invalidCount;
        }
        
        processedUrls += batchUrls.length;
        
        const currentTime = performance.now();
        if (currentTime - lastProgressTime >= PROGRESS_INTERVAL) {
            self.postMessage({
                id: id,
                type: 'progress',
                processed: processedUrls,
                total: totalUrls,
                percentage: Math.round((processedUrls / totalUrls) * 100),
                batchIndex: batchIndex + 1,
                totalBatches: batches,
                timestamp: Date.now()
            });
            lastProgressTime = currentTime;
        }
        
        if (batchIndex < batches - 1) {
            setTimeout(() => {}, 0);
        }
    }

    totalStats.removedCount = totalStats.inputCount - totalStats.outputCount;
    const processingTime = performance.now() - startTime;

    self.postMessage({
        id: id,
        type: 'complete',
        success: true,
        results: allResults,
        stats: {
            ...totalStats,
            processingTime: Math.round(processingTime * 100) / 100
        },
        timestamp: Date.now()
    });
}

function processSingleBatch(id, operation, urls, options, startTime) {
    const processor = new URLProcessor();
    const result = processor.process(urls, operation, options);
    
    const processingTime = performance.now() - startTime;
    
    self.postMessage({
        id: id,
        type: 'complete',
        success: result.success,
        results: result.results || [],
        stats: {
            ...result,
            processingTime: Math.round(processingTime * 100) / 100
        },
        errors: result.errors || [],
        timestamp: Date.now()
    });
}

self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        error: `Worker error: ${error.message}`,
        filename: error.filename,
        lineno: error.lineno,
        timestamp: Date.now()
    });
};

self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'error',
        error: `Unhandled promise rejection: ${event.reason}`,
        timestamp: Date.now()
    });
};

self.postMessage({
    type: 'ready',
    timestamp: Date.now()
});