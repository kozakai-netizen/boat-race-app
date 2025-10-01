#!/usr/bin/env python3
"""
fan2504/fan2404ファイルをCSV形式に変換するスクリプト
"""

import csv
import sys
import os

def parse_racer_record(line, period_year, period_half):
    """選手レコードをパース"""
    if not line or len(line.strip()) == 0:
        return None

    try:
        # 基本情報の抽出
        registration_number = line[0:4].strip()
        name_kanji = line[4:16].strip()
        name_kana = line[16:28].strip()
        branch = line[28:31].strip()
        class_char = line[31:32].strip()

        # 名前の清掃（全角スペースと特殊文字を除去）
        name_kanji = name_kanji.replace('　', '').replace(' ', '')
        # 日本語文字のみ抽出
        name_kanji = ''.join(c for c in name_kanji if '\u4e00' <= c <= '\u9faf' or '\u3040' <= c <= '\u309f')

        # カタカナ名の清掃（余分なスペースと支部情報を除去）
        name_kana = name_kana.strip()
        # カタカナ部分のみ抽出（半角カタカナ、全角カタカナ、スペース）
        name_kana = ''.join(c for c in name_kana if '\uff61' <= c <= '\uff9f' or '\u30a0' <= c <= '\u30ff' or c == ' ')
        name_kana = name_kana.strip()

        # 支部名の清掃（漢字のみ）
        branch = ''.join(c for c in branch if '\u4e00' <= c <= '\u9faf')

        # 級別の検証
        if class_char not in ['A1', 'A2', 'B1', 'B2']:
            # 他の位置で級別を探す
            for i in range(31, min(len(line), 50)):
                if line[i:i+2] in ['A1', 'A2', 'B1', 'B2']:
                    class_char = line[i:i+2]
                    break
            else:
                class_char = 'B1'  # デフォルト

        return {
            'racer_number': int(registration_number),
            'racer_name': name_kanji if name_kanji else f'選手{registration_number}',
            'racer_name_kana': name_kana.strip(),
            'branch': branch if branch else '不明',
            'grade': class_char,
            'period_year': period_year,
            'period_half': period_half
        }
    except Exception as e:
        print(f"Error parsing line: {line[:50]}... - {e}")
        return None

def convert_to_csv(input_file, output_file, period_year, period_half):
    """ファイルをCSVに変換"""
    print(f"🔄 Converting {input_file} to {output_file}")
    print(f"📅 Period: {period_year}年{period_half}")

    # ファイル読み込み
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        return False

    with open(input_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    print(f"📄 Read {len(lines)} lines from {input_file}")

    # CSVに変換
    records = []
    for line_num, line in enumerate(lines, 1):
        record = parse_racer_record(line.strip(), period_year, period_half)
        if record:
            records.append(record)
        elif line.strip():  # 空行でない場合のみ警告
            print(f"⚠️ Failed to parse line {line_num}: {line[:30]}...")

    print(f"✅ Successfully parsed {len(records)} records")

    # CSV出力（クォート処理とLF改行コード）
    if records:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['racer_number', 'racer_name', 'racer_name_kana', 'branch', 'grade', 'period_year', 'period_half']
            writer = csv.DictWriter(
                csvfile,
                fieldnames=fieldnames,
                quoting=csv.QUOTE_ALL,  # 全フィールドをクォート
                lineterminator='\n'     # LF改行コード
            )

            # ヘッダー書き込み
            writer.writeheader()

            # データ書き込み
            for record in records:
                writer.writerow(record)

        print(f"💾 CSV saved to {output_file}")
        return True
    else:
        print("❌ No valid records to save")
        return False

def preview_csv(csv_file, lines=5):
    """CSVファイルの最初の数行をプレビュー"""
    print(f"\n📋 Preview of {csv_file} (first {lines} lines):")
    print("-" * 80)

    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            for i, row in enumerate(reader):
                if i >= lines + 1:  # ヘッダー + 指定行数
                    break
                if i == 0:
                    print("| " + " | ".join(f"{col:12}" for col in row) + " |")
                    print("-" * 80)
                else:
                    print("| " + " | ".join(f"{str(col):12}" for col in row) + " |")
        print("-" * 80)
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")

if __name__ == "__main__":
    # fan2504の変換
    print("🚀 Starting CSV conversion process...")

    success1 = convert_to_csv(
        'data/fan2504_utf8.txt',
        'data/fan2504_import.csv',
        2025,
        '前期'
    )

    if success1:
        preview_csv('data/fan2504_import.csv', 5)

    print("\n" + "="*80)

    # fan2404の変換
    success2 = convert_to_csv(
        'data/fan2404_utf8.txt',
        'data/fan2404_import.csv',
        2024,
        '前期'
    )

    if success2:
        preview_csv('data/fan2404_import.csv', 5)

    # 結果サマリー
    print("\n🎉 Conversion Summary:")
    print(f"fan2504 → CSV: {'✅ Success' if success1 else '❌ Failed'}")
    print(f"fan2404 → CSV: {'✅ Success' if success2 else '❌ Failed'}")

    if success1 or success2:
        print("\n📝 Next steps:")
        print("1. Open Supabase dashboard")
        print("2. Navigate to Table Editor → racer_data")
        print("3. Click 'Insert' → 'Import data from CSV'")
        print("4. Upload the generated CSV files")