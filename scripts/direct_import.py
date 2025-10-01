#!/usr/bin/env python3
"""
fan2504/fan2404データの直接インポートスクリプト
"""

import psycopg2
import sys
import os
from datetime import datetime

# Supabase接続情報
SUPABASE_URL = "https://pglnzxffclnbncfqglnp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbG56eGZmY2xuYm5jZnFnbG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MTU5MzIsImV4cCI6MjA0MzM5MTkzMn0.eWP5vU_WrL_U7y3IYHKQVwMQU68DXtgp2WHJKBKwNOw"

# PostgreSQL接続文字列（Supabase用）
DATABASE_URL = "postgresql://postgres.pglnzxffclnbncfqglnp:GBiXsHkO1YWGLpP1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

def parse_racer_record(line, period_year, period_half):
    """選手レコードをパース"""
    if not line or len(line.strip()) == 0:
        return None

    try:
        registration_number = line[0:4].strip()
        name_kanji = line[4:16].strip()
        name_kana = line[16:28].strip()
        branch = line[28:31].strip()
        class_char = line[31:32].strip()
        gender_char = line[32:33].strip()

        # 生年月日の解析 (34-39文字目)
        birth_str = line[34:40].strip()
        birth_date = None

        if birth_str and len(birth_str) >= 6:
            try:
                year = int(birth_str[0:2]) + 1988  # S22 -> 2010
                month = int(birth_str[2:4])
                day = int(birth_str[4:6])

                if 1 <= month <= 12 and 1 <= day <= 31:
                    birth_date = f"{year}-{month:02d}-{day:02d}"
            except:
                print(f"Failed to parse birth date for {registration_number}: {birth_str}")

        return {
            'racer_number': int(registration_number),
            'racer_name': name_kanji,
            'racer_name_kana': name_kana,
            'grade': class_char,
            'branch': branch,
            'gender': 'M' if gender_char == 'S' else 'F',
            'birth_date': birth_date,
            'period_year': period_year,
            'period_half': period_half,
            'raw_data': line.strip()
        }
    except Exception as e:
        print(f"Error parsing line: {line[:50]}... - {e}")
        return None

def import_fan_data(filename, period_year, period_half):
    """fanデータをインポート"""
    print(f"🚀 Starting {filename} ({period_year}年{period_half}) import...")

    # ファイル読み込み
    filepath = os.path.join(os.getcwd(), 'data', filename)

    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            lines = file.readlines()
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False

    print(f"📄 Read {len(lines)} lines from {filename}")

    # PostgreSQL接続
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected to Supabase PostgreSQL")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

    # バッチインサート
    batch_size = 100
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(lines), batch_size):
        batch = lines[i:i + batch_size]
        parsed_batch = [parse_racer_record(line.strip(), period_year, period_half)
                       for line in batch]
        parsed_batch = [record for record in parsed_batch if record is not None]

        if parsed_batch:
            try:
                # UPSERT SQL
                insert_sql = """
                INSERT INTO racer_data (
                    racer_number, racer_name, racer_name_kana, grade, branch,
                    gender, birth_date, period_year, period_half, raw_data,
                    created_at, updated_at
                ) VALUES %s
                ON CONFLICT (racer_number, period_year, period_half)
                DO UPDATE SET
                    racer_name = EXCLUDED.racer_name,
                    racer_name_kana = EXCLUDED.racer_name_kana,
                    grade = EXCLUDED.grade,
                    branch = EXCLUDED.branch,
                    gender = EXCLUDED.gender,
                    birth_date = EXCLUDED.birth_date,
                    raw_data = EXCLUDED.raw_data,
                    updated_at = EXCLUDED.updated_at
                """

                # データ準備
                values = []
                now = datetime.now().isoformat()

                for record in parsed_batch:
                    values.append((
                        record['racer_number'],
                        record['racer_name'],
                        record['racer_name_kana'],
                        record['grade'],
                        record['branch'],
                        record['gender'],
                        record['birth_date'],
                        record['period_year'],
                        record['period_half'],
                        record['raw_data'],
                        now,
                        now
                    ))

                # 実行
                from psycopg2.extras import execute_values
                execute_values(cursor, insert_sql, values,
                             template=None, page_size=100)
                conn.commit()

                total_inserted += len(parsed_batch)
                print(f"✅ Batch {i//batch_size + 1}: {len(parsed_batch)} records")

            except Exception as e:
                print(f"❌ Batch {i//batch_size + 1} error: {e}")
                total_errors += len(parsed_batch)
                conn.rollback()

    # 確認クエリ
    try:
        cursor.execute(
            "SELECT COUNT(*) FROM racer_data WHERE period_year = %s AND period_half = %s",
            (period_year, period_half)
        )
        count = cursor.fetchone()[0]
        print(f"✅ Verification: {count} records in database for {period_year}年{period_half}")
    except Exception as e:
        print(f"❌ Verification failed: {e}")

    cursor.close()
    conn.close()

    print("🎉 Import completed!")
    print(f"📊 Total inserted: {total_inserted}")
    print(f"❌ Total errors: {total_errors}")

    return total_errors == 0

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python direct_import.py <filename> <period_year> <period_half>")
        print("Example: python direct_import.py fan2504_utf8.txt 2025 前期")
        sys.exit(1)

    filename = sys.argv[1]
    period_year = int(sys.argv[2])
    period_half = sys.argv[3]

    success = import_fan_data(filename, period_year, period_half)
    sys.exit(0 if success else 1)