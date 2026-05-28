"""Daily MongoDB backup script. Keeps last 7 days.

Usage:
  python3 /app/scripts/backup_mongo.py

Schedule with cron (run daily at 3 AM Conakry time = 3 AM UTC):
  echo '0 3 * * * cd /app && /usr/bin/python3 scripts/backup_mongo.py >> /var/log/backup_mongo.log 2>&1' | crontab -

Restore:
  mongorestore --uri="$MONGO_URL" --drop /app/backups/YYYY-MM-DD
"""
import os
import subprocess
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
BACKUP_DIR = Path("/app/backups")
RETENTION_DAYS = 7


def main():
    BACKUP_DIR.mkdir(exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    target = BACKUP_DIR / today
    if target.exists():
        shutil.rmtree(target)
    print(f"[{datetime.now().isoformat()}] Backing up {DB_NAME} to {target}")
    result = subprocess.run(
        ["mongodump", "--uri", MONGO_URL, "--db", DB_NAME, "--out", str(target)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"❌ Backup FAILED: {result.stderr}")
        return 1
    size_mb = sum(f.stat().st_size for f in target.rglob("*") if f.is_file()) // (1024 * 1024)
    print(f"✅ Backup OK: {size_mb} MB")
    # Cleanup old backups
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    for entry in BACKUP_DIR.iterdir():
        if entry.is_dir():
            try:
                date = datetime.strptime(entry.name, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if date < cutoff:
                    shutil.rmtree(entry)
                    print(f"🗑️  Deleted old backup: {entry.name}")
            except ValueError:
                pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
