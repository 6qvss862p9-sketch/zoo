require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'shelter'
});

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const SELECT = `
  SELECT a.id, a.name, s.name AS species, a.sex, a.status, a.vaccinated,
         a.photo_url, a.description,
         to_char(a.birth_date, 'YYYY-MM-DD') AS birth_date
  FROM shelter.animals a JOIN shelter.species s ON s.id = a.species_id`;

app.get('/api/animals', async (req, res) => {
  try {
    const r = await pool.query(SELECT + " WHERE a.status = 'available' ORDER BY a.id");
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Сервер қатесі' }); }
});

app.get('/api/animals/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Қате ID' });
  try {
    const r = await pool.query(SELECT + ' WHERE a.id = $1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Жануар табылмады' });
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Сервер қатесі' }); }
});

// Үйге алу сұранысы: өтініш берушіні сақтап, сұраныс жасайды
app.post('/api/requests', async (req, res) => {
  const { animal_id, full_name, phone, email } = req.body || {};
  if (!Number.isInteger(animal_id) || !full_name || !phone || !email)
    return res.status(400).json({ error: 'Барлық өрісті толтырыңыз' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const a = await client.query('SELECT status FROM shelter.animals WHERE id = $1', [animal_id]);
    if (!a.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Жануар табылмады' }); }
    if (a.rows[0].status !== 'available') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Бұл жануарға қазір сұраныс қабылданбайды' }); }
    const p = await client.query(
      `INSERT INTO shelter.adopters(full_name, phone, email, city)
       VALUES ($1, $2, $3, 'Алматы')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone
       RETURNING id`, [full_name.trim(), phone.trim(), email.trim().toLowerCase()]);
    const r = await client.query(
      `INSERT INTO shelter.adoption_requests(animal_id, adopter_id) VALUES ($1, $2) RETURNING id`,
      [animal_id, p.rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e); res.status(500).json({ error: 'Сервер қатесі' });
  } finally { client.release(); }
});

app.listen(3000, () => console.log('http://localhost:3000'));
