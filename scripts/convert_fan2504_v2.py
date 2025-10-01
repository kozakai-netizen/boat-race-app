#!/usr/bin/env python3
"""
fan2504ファイルを完全にクリーンなCSV形式に変換するスクリプト（v2）
UTF-8エンコーディング（BOMなし）、LF改行コード、全フィールドクォート
"""

import csv
import sys
import os

def parse_racer_record(line, period_year, period_half):
    """選手レコードをパース（改良版）"""
    if not line or len(line.strip()) == 0:
        return None

    try:
        # 基本情報の抽出（固定長フォーマット）
        registration_number = line[0:4].strip()
        name_kanji = line[4:16].strip()
        name_kana = line[16:28].strip()
        branch = line[28:31].strip()
        class_char = line[31:32].strip()

        # 登録番号の検証
        if not registration_number.isdigit():
            return None

        # 名前の清掃（全角スペースと特殊文字を除去）
        name_kanji = name_kanji.replace('　', '').replace(' ', '')
        # 日本語文字のみ抽出（ひらがな、カタカナ、漢字）
        name_kanji = ''.join(c for c in name_kanji if
                           '\u4e00' <= c <= '\u9faf' or  # 漢字
                           '\u3040' <= c <= '\u309f' or  # ひらがな
                           '\u30a0' <= c <= '\u30ff')    # カタカナ

        # カタカナ名の清掃
        name_kana = name_kana.strip()
        # カタカナ部分のみ抽出（半角カタカナ、全角カタカナ、スペース）
        name_kana = ''.join(c for c in name_kana if
                          '\uff61' <= c <= '\uff9f' or  # 半角カタカナ
                          '\u30a0' <= c <= '\u30ff' or  # 全角カタカナ
                          c == ' ')
        name_kana = name_kana.strip()

        # 支部名の清掃（漢字のみ）
        branch = ''.join(c for c in branch if '\u4e00' <= c <= '\u9faf')

        # 級別の検証と修正
        if class_char not in ['A', 'B']:
            # 他の位置で級別を探す
            for i in range(31, min(len(line), 50)):
                if line[i:i+2] in ['A1', 'A2', 'B1', 'B2']:
                    class_char = line[i:i+2]
                    break
            else:
                # デフォルト級別設定
                class_char = 'B1'
        else:
            # A, Bの場合は次の文字も確認
            if len(line) > 32 and line[32] in ['1', '2']:
                class_char = class_char + line[32]
            else:
                class_char = class_char + '1'  # デフォルト

        # 名前が空の場合のフォールバック
        if not name_kanji:
            name_kanji = f'選手{registration_number}'

        return {
            'racer_number': int(registration_number),
            'racer_name': name_kanji,
            'racer_name_kana': name_kana,
            'branch': branch if branch else '不明',
            'grade': class_char,
            'period_year': period_year,
            'period_half': period_half
        }
    except Exception as e:
        print(f"Error parsing line: {line[:50]}... - {e}")
        return None

def convert_to_csv_v2(input_file, output_file, period_year, period_half):
    """ファイルを完全にクリーンなCSVに変換（v2）"""
    print(f"🔄 Converting {input_file} to {output_file} (v2)")
    print(f"📅 Period: {period_year}年{period_half}")

    # ファイル存在確認
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        return False

    # ファイル読み込み（UTF-8）
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

    # CSV出力（厳密な設定）
    if records:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['racer_number', 'racer_name', 'racer_name_kana', 'branch', 'grade', 'period_year', 'period_half']
            writer = csv.DictWriter(
                csvfile,
                fieldnames=fieldnames,
                quoting=csv.QUOTE_ALL,    # 全フィールドをクォート
                lineterminator='\n'       # LF改行コード
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

if __name__ == "__main__":
    print("🚀 Starting clean CSV conversion (v2)...")

    success = convert_to_csv_v2(
        'data/fan2504_utf8.txt',
        'data/fan2504_import_v2.csv',
        2025,
        '前期'
    )

    if success:
        print("\n✅ Conversion completed successfully!")
    else:
        print("\n❌ Conversion failed!")