import { pool } from './database.js';

const createTables = async () => {
  const client = await pool.connect();

  try {
    // Create compounds table - following the frontend guidelines exactly
    await client.query(`
      CREATE TABLE IF NOT EXISTS compounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stt_rc SERIAL NOT NULL UNIQUE,
        stt_hc INTEGER,
        code_hc INTEGER,
        ten_hc VARCHAR(255) NOT NULL,
        ten_hc_khac VARCHAR(255),
        loai_hc VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        ten_latin VARCHAR(255),
        ten_ta VARCHAR(255),
        ten_tv VARCHAR(255),
        bpnc TEXT,
        nguon_khac TEXT,
        trang_thai VARCHAR(100) NOT NULL,
        mau VARCHAR(100) NOT NULL,
        uv_sklm JSONB DEFAULT '{"nm254": false, "nm365": false}',
        diem_nong_chay VARCHAR(100),
        alpha_d VARCHAR(100),
        dung_moi_hoa_tan_tcvl TEXT,
        ctpt TEXT NOT NULL,
        klpt VARCHAR(50),
        hinh_cau_truc TEXT,
        cau_hinh_tuyet_doi BOOLEAN DEFAULT FALSE,
        smiles TEXT,
        pho JSONB DEFAULT '{}',
        dm_nmr_general TEXT,
        cart_coor TEXT,
        img_freq VARCHAR(100),
        te VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create nmr_data_blocks table - following the frontend guidelines exactly
    await client.query(`
      CREATE TABLE IF NOT EXISTS nmr_data_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        compound_id UUID NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
        stt_bang SERIAL NOT NULL UNIQUE,
        dm_nmr TEXT,
        tan_so_13c VARCHAR(50),
        tan_so_1h VARCHAR(50),
        luu_y_nmr TEXT,
        tltk_nmr TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate existing stt_bang data if needed
    await client.query(`
      DO $$
      BEGIN
        -- Check if stt_bang column exists and is VARCHAR
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'nmr_data_blocks'
          AND column_name = 'stt_bang'
          AND data_type = 'character varying'
        ) THEN
          -- Create a temporary column
          ALTER TABLE nmr_data_blocks ADD COLUMN stt_bang_new SERIAL;

          -- Assign unique sequential numbers to existing records
          UPDATE nmr_data_blocks
          SET stt_bang_new = subquery.new_id
          FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_id
            FROM nmr_data_blocks
          ) as subquery
          WHERE nmr_data_blocks.id = subquery.id;

          -- Drop the old column and rename the new one
          ALTER TABLE nmr_data_blocks DROP COLUMN stt_bang;
          ALTER TABLE nmr_data_blocks RENAME COLUMN stt_bang_new TO stt_bang;

          -- Add unique constraint
          ALTER TABLE nmr_data_blocks ADD CONSTRAINT nmr_data_blocks_stt_bang_unique UNIQUE (stt_bang);
        END IF;
      END $$;
    `);

    // Remove unique index to allow multiple NMR data blocks per compound
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_nmr_data_compound_id'
        ) THEN
          EXECUTE 'DROP INDEX idx_unique_nmr_data_compound_id';
        END IF;
      END $$;
    `);

    // Add nguon_khac column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'compounds'
          AND column_name = 'nguon_khac'
        ) THEN
          ALTER TABLE compounds ADD COLUMN nguon_khac TEXT;
        END IF;
      END $$;
    `);

    // Add stt_hc column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'compounds'
          AND column_name = 'stt_hc'
        ) THEN
          ALTER TABLE compounds ADD COLUMN stt_hc INTEGER;
        END IF;
      END $$;
    `);

    // Add code_hc column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'compounds'
          AND column_name = 'code_hc'
        ) THEN
          ALTER TABLE compounds ADD COLUMN code_hc INTEGER;
        END IF;
      END $$;
    `);

    // Create regular (non-unique) index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nmr_data_blocks_compound_id ON nmr_data_blocks(compound_id);
    `);

    // Create nmr_signals table - following the frontend guidelines exactly
    await client.query(`
      CREATE TABLE IF NOT EXISTS nmr_signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nmr_data_block_id UUID NOT NULL REFERENCES nmr_data_blocks(id) ON DELETE CASCADE,
        vi_tri VARCHAR(100),
        scab TEXT,
        shac_j_hz TEXT,
        sort_order SERIAL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compounds_stt_rc ON compounds(stt_rc);
      CREATE INDEX IF NOT EXISTS idx_compounds_stt_hc ON compounds(stt_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_code_hc ON compounds(code_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_ten_hc ON compounds(ten_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_loai_hc ON compounds(loai_hc);
      CREATE INDEX IF NOT EXISTS idx_compounds_created_at ON compounds(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_nmr_data_blocks_compound_id ON nmr_data_blocks(compound_id);
      CREATE INDEX IF NOT EXISTS idx_nmr_data_blocks_stt_bang ON nmr_data_blocks(stt_bang);
      CREATE INDEX IF NOT EXISTS idx_nmr_signals_nmr_data_block_id ON nmr_signals(nmr_data_block_id);
    `);

    console.log('Database tables created successfully following frontend guidelines');
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
