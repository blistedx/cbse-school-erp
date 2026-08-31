/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function updateNoticesRefNo() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const notices = await db.collection('notices').find({}).sort({ created_at: 1 }).toArray();
  console.log(`Found ${notices.length} notices in Atlas.`);

  let count = 1;
  for (const n of notices) {
    let matter = (n.matter_category || '').toUpperCase().trim();
    if (!matter) {
      const text = `${n.title || ''} ${n.content || ''}`.toLowerCase();
      if (/holiday|break|autumn|vacation/i.test(text)) matter = 'HOLIDAY';
      else if (/exam|test|datesheet/i.test(text)) matter = 'EXAM';
      else if (/cbse|board/i.test(text)) matter = 'CBSE';
      else if (/fee|dues/i.test(text)) matter = 'FEES';
      else if (/office|admin/i.test(text)) matter = 'OFFICE';
      else matter = 'ACAD';
    }
    
    // Format: FIRST SCHOOL NAME (DPS)/YEAR(2026)/DATE(30/8)/MATTER/0001
    const refNo = `DPS/2026/30/8/${matter}/${String(count).padStart(4, '0')}`;
    const date = n.date || (n.created_at ? n.created_at.split('T')[0] : '2026-08-30');
    const createdAt = n.created_at || new Date().toISOString();

    await db.collection('notices').updateOne(
      { _id: n._id },
      { $set: { reference_no: refNo, matter_category: matter, date: date, created_at: createdAt } }
    );
    count++;
  }
  console.log('Updated Atlas notices with exact DPS/2026/30/8/MATTER/0001 format.');

  const storeFile = 'data/erp_store.json';
  if (fs.existsSync(storeFile)) {
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    let sCount = 1;
    store.notices = (store.notices || []).map(n => {
      let matter = (n.matter_category || '').toUpperCase().trim();
      if (!matter) {
        const text = `${n.title || ''} ${n.content || ''}`.toLowerCase();
        if (/holiday|break|autumn|vacation/i.test(text)) matter = 'HOLIDAY';
        else if (/exam|test|datesheet/i.test(text)) matter = 'EXAM';
        else if (/cbse|board/i.test(text)) matter = 'CBSE';
        else if (/fee|dues/i.test(text)) matter = 'FEES';
        else if (/office|admin/i.test(text)) matter = 'OFFICE';
        else matter = 'ACAD';
      }
      const refNo = `DPS/2026/30/8/${matter}/${String(sCount).padStart(4, '0')}`;
      const date = n.date || (n.created_at ? n.created_at.split('T')[0] : '2026-08-30');
      sCount++;
      return {
        ...n,
        reference_no: refNo,
        matter_category: matter,
        date: date,
        created_at: n.created_at || new Date().toISOString()
      };
    });
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
    console.log('Updated data/erp_store.json with DPS/2026/30/8/MATTER/0001 format.');
  }

  await client.close();
}

updateNoticesRefNo().catch(console.error);
