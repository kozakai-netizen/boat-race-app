const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase設定（直接値指定）
const supabaseUrl = 'https://pglnzxffclnbncfqglnp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbG56eGZmY2xuYm5jZnFnbG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MTU5MzIsImV4cCI6MjA0MzM5MTkzMn0.eWP5vU_WrL_U7y3IYHKQVwMQU68DXtgp2WHJKBKwNOw';
const supabase = createClient(supabaseUrl, supabaseKey);

// fan2410と同じパーサー関数
function parseRacerRecord(line) {
  if (!line || line.trim().length === 0) return null;

  try {
    const registration_number = line.substring(0, 4).trim();
    const name_kanji = line.substring(4, 16).trim();
    const name_kana = line.substring(16, 28).trim();
    const branch = line.substring(28, 31).trim();
    const class_char = line.substring(31, 32).trim();
    const gender_char = line.substring(32, 33).trim();

    // 生年月日の解析 (34-39文字目)
    const birth_str = line.substring(34, 40).trim();
    let birth_date = null;

    if (birth_str && birth_str.length >= 6) {
      try {
        const year = parseInt(birth_str.substring(0, 2)) + 1988; // S22 -> 2010
        const month = parseInt(birth_str.substring(2, 4));
        const day = parseInt(birth_str.substring(4, 6));

        if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          birth_date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      } catch (err) {
        console.warn(`Failed to parse birth date for ${registration_number}: ${birth_str}`);
      }
    }

    return {
      racer_number: parseInt(registration_number),
      racer_name: name_kanji,
      racer_name_kana: name_kana,
      grade: class_char,
      branch: branch,
      gender: gender_char === 'S' ? 'M' : 'F',
      birth_date: birth_date,
      period_year: 2025,
      period_half: '前期',
      raw_data: line.trim()
    };
  } catch (error) {
    console.error(`Error parsing line: ${line.substring(0, 50)}...`, error);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Starting fan2504 (2025年前期) import...');

    // ファイル読み込み
    const filePath = path.join(process.cwd(), 'data', 'fan2504_utf8.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    console.log(`📄 Read ${lines.length} lines from fan2504_utf8.txt`);

    // パースとバッチ挿入
    const batchSize = 100;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const parsedBatch = batch.map(parseRacerRecord).filter(Boolean);

      if (parsedBatch.length > 0) {
        const { data, error } = await supabase
          .from('racer_data')
          .upsert(parsedBatch, {
            onConflict: 'racer_number,period_year,period_half'
          });

        if (error) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error);
          totalErrors += parsedBatch.length;
        } else {
          totalInserted += parsedBatch.length;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${parsedBatch.length} records`);
        }
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`📊 Total inserted: ${totalInserted}`);
    console.log(`❌ Total errors: ${totalErrors}`);

    // 確認クエリ
    const { count } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })
      .eq('period_year', 2025)
      .eq('period_half', '前期');

    console.log(`✅ Verification: ${count} records in database for 2025年前期`);

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

main();