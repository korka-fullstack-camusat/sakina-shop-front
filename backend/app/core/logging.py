import logging

import structlog

from app.core.config import settings


def setup_logging() -> None:
    level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO
    logging.basicConfig(level=level, format="%(message)s")

    # Silencie les logs DEBUG trop bavards de pymongo
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.APP_ENV == "development":
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


logger = structlog.get_logger()
