# Run this after Postgres is up. Adjust connection string if needed.
$env:PGPASSWORD = 'resume'
psql -h localhost -U resume -d resume_builder -f .\backend\schema.sql
