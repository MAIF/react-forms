const schema = `{
    "target_refs": {
        "label": "target_refs",
        "type": "string",
        "array": true,
        "format": null
    },
    "root": {
        "label": "root",
        "type": "string"
    },
    "client": {
        "label": "client",
        "type": "object",
        "format": "form",
        "collapsable": true,
        "collapsed": true,
        "schema": {
            "custom_timeouts": {
                "label": "custom_timeouts",
                "type": "object"
                "array": true,
                "format": "form",
                "schema": {
                    "connection_timeout": {
                        "label": "connection_timeout",
                        "type": "number"
                    },
                    "call_and_stream_timeout": {
                        "label": "call_and_stream_timeout",
                        "type": "number"
                    },
                    "path": {
                        "label": "path",
                        "type": "string"
                    },
                    "call_timeout": {
                        "label": "call_timeout",
                        "type": "number"
                    },
                    "idle_timeout": {
                        "label": "idle_timeout",
                        "type": "number"
                    },
                    "global_timeout": {
                        "label": "global_timeout",
                        "type": "number"
                    }
                },
                "flow": [
                    "connection_timeout",
                    "call_and_stream_timeout",
                    "path",
                    "call_timeout",
                    "idle_timeout",
                    "global_timeout"
                ]
            },
            "global_timeout": {
                "label": "global_timeout",
                "type": "number"
            },
            "max_errors": {
                "label": "max_errors",
                "type": "number"
            },
            "retry_initial_delay": {
                "label": "retry_initial_delay",
                "type": "number"
            },
            "backoff_factor": {
                "label": "backoff_factor",
                "type": "number"
            },
            "cache_connection_settings": {
                "label": "cache_connection_settings",
                "type": "object",
                "format": "form",
                "collapsable": true,
                "collapsed": true,
                "schema": {
                    "queue_size": {
                        "label": "queue_size",
                        "type": "number"
                    },
                    "enabled": {
                        "label": "enabled",
                        "type": "bool"
                    }
                },
                "flow": [
                    "queue_size",
                    "enabled"
                ]
            },
            "sample_interval": {
                "label": "sample_interval",
                "type": "number"
            },
            "call_and_stream_timeout": {
                "label": "call_and_stream_timeout",
                "type": "number"
            },
            "retries": {
                "label": "retries",
                "type": "number"
            },
            "proxy": {
                "label": "proxy",
                "type": "object",
                "format": "form",
                "collapsable": true,
                "collapsed": true,
                "schema": {},
                "flow": []
            },
            "call_timeout": {
                "label": "call_timeout",
                "type": "number"
            },
            "idle_timeout": {
                "label": "idle_timeout",
                "type": "number"
            },
            "connection_timeout": {
                "label": "connection_timeout",
                "type": "number"
            }
        },
        "flow": [
            "custom_timeouts",
            "global_timeout",
            "max_errors",
            "retry_initial_delay",
            "backoff_factor",
            "cache_connection_settings",
            "sample_interval",
            "call_and_stream_timeout",
            "retries",
            "proxy",
            "call_timeout",
            "idle_timeout",
            "connection_timeout"
        ]
    },
    "health_check": {
        "label": "health_check",
        "type": "object",
        "format": "form",
        "collapsable": true,
        "collapsed": true,
        "schema": {
            "enabled": {
                "label": "enabled",
                "type": "bool"
            },
            "url": {
                "label": "url",
                "type": "string"
            }
        },
        "flow": [
            "enabled",
            "url"
        ]
    },
    "targets": {
        "label": "targets",
        "type": "object",
        "array": true,
        "format": "form",
        "schema": {
            "predicate": {
                "label": "predicate",
                "type": "object",
                "format": "form",
                "collapsable": true,
                "collapsed": true,
                "schema": {
                    "rack": {
                        "label": "rack",
                        "type": "string"
                    },
                    "provider": {
                        "label": "provider",
                        "type": "string"
                    },
                    "dataCenter": {
                        "label": "dataCenter",
                        "type": "string"
                    },
                    "zone": {
                        "label": "zone",
                        "type": "string"
                    },
                    "positions": {
                        "label": "positions",
                        "type": "object",
                        "array": true,
                        "format": "form",
                        "schema": {
                            "latitude": {
                                "label": "latitude",
                                "type": "number"
                            },
                            "longitude": {
                                "label": "longitude",
                                "type": "number"
                            },
                            "radius": {
                                "label": "radius",
                                "type": "number"
                            }
                        },
                        "flow": [
                            "latitude",
                            "longitude",
                            "radius"
                        ]
                    },
                    "type": {
                        "label": "type",
                        "type": "string",
                        "format": "select",
                        "options": [
                            "AlwaysMatch",
                            "NetworkLocationMatch",
                            "GeolocationMatch"
                        ]
                    },
                    "region": {
                        "label": "region",
                        "type": "string"
                    },
                    "dc": {
                        "label": "dc",
                        "type": "string"
                    }
                },
                "flow": [
                    "rack",
                    "provider",
                    "dataCenter",
                    "zone",
                    "positions",
                    "type",
                    "region",
                    "dc"
                ]
            },
            "protocol": {
                "label": "protocol",
                "type": "string"
            },
            "hostname": {
                "label": "hostname",
                "type": "string"
            },
            "port": {
                "label": "port",
                "type": "number"
            },
            "weight": {
                "label": "weight",
                "type": "number"
            },
            "tls": {
                "label": "tls",
                "type": "bool"
            },
            "tls_config": {
                "label": "tls_config",
                "type": "object",
                "format": "form",
                "collapsable": true,
                "collapsed": true,
                "schema": {
                    "enabled": {
                        "label": "enabled",
                        "type": "bool"
                    },
                    "certs": {
                        "label": "certs",
                        "type": "string",
                        "array": true,
                        "format": null
                    },
                    "loose": {
                        "label": "loose",
                        "type": "bool"
                    },
                    "trust_all": {
                        "label": "trust_all",
                        "type": "bool"
                    },
                    "trusted_certs": {
                        "label": "trusted_certs",
                        "type": "string",
                        "array": true,
                        "format": null
                    }
                },
                "flow": [
                    "enabled",
                    "certs",
                    "loose",
                    "trust_all",
                    "trusted_certs"
                ]
            },
            "id": {
                "label": "id",
                "type": "string"
            },
            "ip_address": {
                "label": "ip_address",
                "type": "string"
            }
        },
        "flow": [
            "protocol",
            "hostname",
            "port",
            "weight",
            "tls",
            "id",
            "ip_address",
            "predicate",
            "tls_config"
        ]
    },
    "rewrite": {
        "label": "rewrite",
        "type": "bool"
    },
    "load_balancing": {
        "label": "load_balancing",
        "type": "object",
        "format": "form",
        "collapsable": true,
        "collapsed": true,
        "schema": {
            "type": {
                "label": "type",
                "type": "string",
                "format": "select",
                "options": [
                    "BestResponseTime",
                    "IpAddressHash",
                    "Random",
                    "RoundRobin",
                    "Sticky",
                    "WeightedBestResponseTime"
                ]
            },
            "ratio": {
                "label": "ratio",
                "type": "number"
            }
        },
        "flow": [
            "type",
            "ratio"
        ]
    }
}`

export default schema