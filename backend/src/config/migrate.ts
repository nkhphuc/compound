import { pool } from './database';

const createTables = async () => {
  const client = await pool.connect();

  try {
    // Create compounds table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stt_hc INTEGER NOT NULL,
        ten_hc VARCHAR(500) NOT NULL,
        ten_hc_khac TEXT,
        loai_hc VARCHAR(200),
        status VARCHAR(50),
        ten_latin TEXT,
        ten_ta TEXT,
        ten_tv TEXT,
        bpnc TEXT,
        trang_thai VARCHAR(100),
        mau VARCHAR(100),
        uv_sklm_nm254 BOOLEAN DEFAULT FALSE,
        uv_sklm_nm365 BOOLEAN DEFAULT FALSE,
        diem_nong_chay TEXT,
        alpha_d TEXT,
        dung_moi_hoa_tan_tcvl TEXT,
        ctpt TEXT,
        klpt TEXT,
        hinh_cau_truc TEXT,
        cau_hinh_tuyet_doi BOOLEAN DEFAULT FALSE,
        smiles TEXT,
        pho_1h TEXT,
        pho_13c TEXT,
        pho_dept TEXT,
        pho_hsqc TEXT,
        pho_hmbc TEXT,
        pho_cosy TEXT,
        pho_noesy TEXT,
        pho_roesy TEXT,
        pho_hrms TEXT,
        pho_lrms TEXT,
        pho_ir TEXT,
        pho_uv_pho TEXT,
        pho_cd TEXT,
        dm_nmr_general TEXT,
        cart_coor TEXT,
        img_freq TEXT,
        te TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create nmr_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nmr_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
        stt_bang VARCHAR(50),
        dm_nmr VARCHAR(100),
        tan_so_13c VARCHAR(50),
        tan_so_1h VARCHAR(50),
        luu_y_nmr TEXT,
        tltk_nmr TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create nmr_signals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nmr_signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nmr_data_id UUID REFERENCES nmr_data(id) ON DELETE CASCADE,
        vi_tri VARCHAR(100),
        scab VARCHAR(100),
        shac_jhz VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compounds_stt_hc ON compounds(stt_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_ten_hc ON compounds(ten_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_loai_hc ON compounds(loai_hc);
      CREATE INDEX IF NOT EXISTS idx_nmr_data_compound_id ON nmr_data(compound_id);
      CREATE INDEX IF NOT EXISTS idx_nmr_signals_nmr_data_id ON nmr_signals(nmr_data_id);
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
