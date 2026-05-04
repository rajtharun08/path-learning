from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def apply_schema_compatibility(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "users" not in table_names:
        return

    columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "password_hash" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''")
            )

        if "role" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'student'")
            )
