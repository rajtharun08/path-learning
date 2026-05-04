#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE user_db;
    CREATE DATABASE content_db;
    CREATE DATABASE progress_db;
    CREATE DATABASE analytics_db;
    CREATE DATABASE path_service_db;
EOSQL
