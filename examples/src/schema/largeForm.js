const schema = `{
    "target_refs": {
        "label": "target_refs",
        "type": "string",
        "constraints": [
            {
                "type": "nullable"
            }
        ],
        "array": true,
        "format": null
    },
    "root": {
        "label": "root",
        "type": "string",
        "constraints": [
            {
                "type": "nullable"
            }
        ]
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
                "type": "object",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ],
                "array": true,
                "format": "form",
                "schema": {
                    "connection_timeout": {
                        "label": "connection_timeout",
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "call_and_stream_timeout": {
                        "label": "call_and_stream_timeout",
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "path": {
                        "label": "path",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "call_timeout": {
                        "label": "call_timeout",
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "idle_timeout": {
                        "label": "idle_timeout",
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "global_timeout": {
                        "label": "global_timeout",
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
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
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "max_errors": {
                "label": "max_errors",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "retry_initial_delay": {
                "label": "retry_initial_delay",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "backoff_factor": {
                "label": "backoff_factor",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
                        "type": "number",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "enabled": {
                        "label": "enabled",
                        "type": "bool",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    }
                },
                "flow": [
                    "queue_size",
                    "enabled"
                ]
            },
            "sample_interval": {
                "label": "sample_interval",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "call_and_stream_timeout": {
                "label": "call_and_stream_timeout",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "retries": {
                "label": "retries",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "idle_timeout": {
                "label": "idle_timeout",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "connection_timeout": {
                "label": "connection_timeout",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
                "type": "bool",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "url": {
                "label": "url",
                "type": "string",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
        "constraints": [
            {
                "type": "nullable"
            }
        ],
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
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "provider": {
                        "label": "provider",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "dataCenter": {
                        "label": "dataCenter",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "zone": {
                        "label": "zone",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "positions": {
                        "label": "positions",
                        "type": "object",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ],
                        "array": true,
                        "format": "form",
                        "schema": {
                            "latitude": {
                                "label": "latitude",
                                "type": "number",
                                "constraints": [
                                    {
                                        "type": "nullable"
                                    }
                                ]
                            },
                            "longitude": {
                                "label": "longitude",
                                "type": "number",
                                "constraints": [
                                    {
                                        "type": "nullable"
                                    }
                                ]
                            },
                            "radius": {
                                "label": "radius",
                                "type": "number",
                                "constraints": [
                                    {
                                        "type": "nullable"
                                    }
                                ]
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
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ],
                        "format": "select",
                        "options": [
                            "AlwaysMatch",
                            "NetworkLocationMatch",
                            "GeolocationMatch"
                        ]
                    },
                    "region": {
                        "label": "region",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "dc": {
                        "label": "dc",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
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
                "type": "string",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "hostname": {
                "label": "hostname",
                "type": "string",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "port": {
                "label": "port",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "weight": {
                "label": "weight",
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "tls": {
                "label": "tls",
                "type": "bool",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
                        "type": "bool",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "certs": {
                        "label": "certs",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ],
                        "array": true,
                        "format": null
                    },
                    "loose": {
                        "label": "loose",
                        "type": "bool",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "trust_all": {
                        "label": "trust_all",
                        "type": "bool",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ]
                    },
                    "trusted_certs": {
                        "label": "trusted_certs",
                        "type": "string",
                        "constraints": [
                            {
                                "type": "nullable"
                            }
                        ],
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
                "type": "string",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            },
            "ip_address": {
                "label": "ip_address",
                "type": "string",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
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
        "type": "bool",
        "constraints": [
            {
                "type": "nullable"
            }
        ]
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
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ],
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
                "type": "number",
                "constraints": [
                    {
                        "type": "nullable"
                    }
                ]
            }
        },
        "flow": [
            "type",
            "ratio"
        ]
    }
}`

export default schema