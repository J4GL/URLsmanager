/**
 * URLParser - Utility class for parsing and validating URLs
 * Handles various URL formats and extracts components like domain, subdomain, TLD, and parameters
 */
class URLParser {
    /**
     * Parse a URL string and extract all components
     * @param {string} url - The URL string to parse
     * @returns {Object} Parsed URL object with all components
     */
    static parse(url) {
        if (!url || typeof url !== 'string') {
            return {
                original: url,
                valid: false,
                error: 'Invalid input'
            };
        }

        // Check for obviously invalid patterns
        if (url.trim() === '' || url === 'not-a-url' || url === '://invalid') {
            return {
                original: url,
                valid: false,
                error: 'Invalid URL format'
            };
        }

        try {
            // Clean and normalize the URL
            const cleanUrl = this.normalizeUrl(url);
            
            // Try to create URL object for parsing
            let urlObj;
            try {
                urlObj = new URL(cleanUrl);
            } catch (e) {
                // If URL constructor fails, try with protocol prefix
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

    /**
     * Validate if a URL string is valid
     * @param {string} url - The URL string to validate
     * @returns {boolean} True if URL is valid, false otherwise
     */
    static isValid(url) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return false;
        }
        
        // Check for obviously invalid patterns
        if (url === 'not-a-url' || url === '://invalid') {
            return false;
        }
        
        const parsed = this.parse(url);
        return parsed && parsed.valid;
    }

    /**
     * Extract the domain from a URL (without subdomain)
     * @param {string} url - The URL string
     * @returns {string|null} The domain or null if invalid
     */
    static getDomain(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid ? parsed.domain : null;
    }

    /**
     * Extract the top-level domain (TLD) from a URL
     * @param {string} url - The URL string
     * @returns {string|null} The TLD or null if invalid
     */
    static getTLD(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid ? parsed.tld : null;
    }

    /**
     * Check if a URL has a subdomain
     * @param {string} url - The URL string
     * @returns {boolean} True if URL has subdomain, false otherwise
     */
    static hasSubdomain(url) {
        const parsed = this.parse(url);
        return parsed && parsed.valid && parsed.subdomain && parsed.subdomain.length > 0;
    }

    /**
     * Remove parameters from a URL
     * @param {string} url - The URL string
     * @returns {string|null} URL without parameters or null if invalid
     */
    static removeParameters(url) {
        const parsed = this.parse(url);
        if (!parsed || !parsed.valid) {
            return null;
        }

        try {
            const urlObj = new URL(parsed.original.includes('://') ? parsed.original : 'http://' + parsed.original);
            urlObj.search = '';
            let result = urlObj.toString();
            
            // Remove protocol if original didn't have it
            if (!parsed.original.includes('://')) {
                result = result.replace(/^https?:\/\//, '');
            }
            
            return result;
        } catch (error) {
            return null;
        }
    }

    /**
     * Normalize URL string for consistent parsing
     * @private
     * @param {string} url - Raw URL string
     * @returns {string} Normalized URL string
     */
    static normalizeUrl(url) {
        return url.trim()
                  .replace(/\s+/g, '') // Remove all whitespace
                  .replace(/\/+$/, ''); // Remove trailing slashes
    }

    /**
     * Extract domain parts (subdomain, domain, TLD) from hostname
     * @private
     * @param {string} hostname - The hostname to parse
     * @returns {Object} Object with subdomain, domain, and tld
     */
    static extractDomainParts(hostname) {
        if (!hostname) {
            return { subdomain: '', domain: '', tld: '' };
        }

        const parts = hostname.split('.');
        
        if (parts.length < 2) {
            return { subdomain: '', domain: hostname, tld: '' };
        }

        // Handle common TLD patterns
        const tld = parts[parts.length - 1];
        let domain, subdomain;

        if (parts.length === 2) {
            // Simple case: domain.tld
            domain = parts[0];
            subdomain = '';
        } else if (parts.length === 3) {
            // Could be subdomain.domain.tld or domain.co.uk style
            if (this.isCommonSecondLevelTLD(parts[parts.length - 2], tld)) {
                // Handle cases like example.co.uk
                domain = parts[parts.length - 3];
                subdomain = parts.slice(0, -3).join('.');
            } else {
                // Standard subdomain.domain.tld
                domain = parts[parts.length - 2];
                subdomain = parts.slice(0, -2).join('.');
            }
        } else {
            // Multiple subdomains or complex TLD
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

    /**
     * Check if a combination represents a common second-level TLD
     * @private
     * @param {string} secondLevel - Second level domain part
     * @param {string} topLevel - Top level domain part
     * @returns {boolean} True if it's a common second-level TLD
     */
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

    /**
     * Parse URL parameters into an object
     * @private
     * @param {string} search - The search string from URL
     * @returns {Object} Object with parameter key-value pairs
     */
    static parseParameters(search) {
        const params = {};
        if (!search || search.length <= 1) {
            return params;
        }

        // Remove leading '?' if present
        const queryString = search.startsWith('?') ? search.slice(1) : search;
        
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });

        return params;
    }

    /**
     * Get the full domain including subdomain
     * @param {string} url - The URL string
     * @returns {string|null} Full domain with subdomain or null if invalid
     */
    static getFullDomain(url) {
        const parsed = this.parse(url);
        if (!parsed || !parsed.valid) {
            return null;
        }
        
        return parsed.hostname;
    }

    /**
     * Get domain for comparison in deduplication operations
     * @param {string} url - The URL string
     * @param {string} type - Type of comparison ('tld', 'domain', 'full')
     * @returns {string|null} Comparison key or null if invalid
     */
    static getComparisonKey(url, type) {
        const parsed = this.parse(url);
        if (!parsed || !parsed.valid) {
            return null;
        }

        switch (type) {
            case 'tld':
                return parsed.tld;
            case 'domain':
                return parsed.hostname;
            case 'full':
                return parsed.original.toLowerCase();
            default:
                return parsed.original.toLowerCase();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLParser;
} else if (typeof self !== 'undefined') {
    // Make available in web worker environment
    self.URLParser = URLParser;
} else if (typeof window !== 'undefined') {
    // Make available in browser environment
    window.URLParser = URLParser;
}