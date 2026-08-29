import logging
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "INFO",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "hostdost.log",
            "formatter": "detailed",
            "level": "DEBUG",
        },
    },
    "loggers": {
        "app": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "sqlalchemy": {
            "handlers": ["file"],
            "level": "WARNING",
            "propagate": False,
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"],
    },
}


def setup_logging():
    logging.config.dictConfig(LOGGING_CONFIG)