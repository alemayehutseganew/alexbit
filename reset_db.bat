@echo off
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'primehorizon' AND pid <> pg_backend_pid();" > reset_output.txt 2>&1
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "DROP DATABASE IF EXISTS primehorizon;" >> reset_output.txt 2>&1
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE primehorizon OWNER primehorizon;" >> reset_output.txt 2>&1
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE primehorizon TO primehorizon;" >> reset_output.txt 2>&1