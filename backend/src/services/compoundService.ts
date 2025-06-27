import { pool } from '../config/database';
import { CompoundData, CompoundStatus, SpectralRecord, NMRDataBlock, NMRCondition, NMRSignalData } from '@compound/shared';
import { v4 as uuidv4 } from 'uuid';

export class CompoundService {
  async getCompounds(options: { page: number; limit: number; searchTerm?: string }) {
    const { page, limit, searchTerm = '' } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        c.*,
        ndb.id as nmr_data_block_id,
        ndb.stt_bang,
        ndb.dm_nmr,
        ndb.tan_so_13c,
        ndb.tan_so_1h,
        ndb.luu_y_nmr,
        ndb.tltk_nmr
      FROM compounds c
      LEFT JOIN nmr_data_blocks ndb ON c.id = ndb.compound_id
    `;

    const queryParams: any[] = [];

    if (searchTerm) {
      query += ` WHERE c.ten_hc ILIKE $1 OR c.stt_hc::text ILIKE $1 OR c.loai_hc ILIKE $1`;
      queryParams.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM compounds';
    if (searchTerm) {
      countQuery += ' WHERE ten_hc ILIKE $1 OR stt_hc::text ILIKE $1 OR loai_hc ILIKE $1';
    }
    const countResult = await pool.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);
    const totalItems = parseInt(countResult.rows[0].count);

    // Transform database rows to CompoundData objects
    const compounds = await this.transformRowsToCompounds(result.rows);

    return {
      data: compounds,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    };
  }

  async getCompoundById(id: string): Promise<CompoundData | null> {
    const query = `
      SELECT
        c.*,
        ndb.id as nmr_data_block_id,
        ndb.stt_bang,
        ndb.dm_nmr,
        ndb.tan_so_13c,
        ndb.tan_so_1h,
        ndb.luu_y_nmr,
        ndb.tltk_nmr
      FROM compounds c
      LEFT JOIN nmr_data_blocks ndb ON c.id = ndb.compound_id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const compounds = await this.transformRowsToCompounds(result.rows);
    return compounds[0];
  }

  async createCompound(compoundData: Partial<CompoundData>): Promise<CompoundData> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate IDs
      const compoundId = uuidv4();
      const nmrDataBlockId = uuidv4();

      // Insert compound with JSONB fields
      const compoundQuery = `
        INSERT INTO compounds (
          id, ten_hc, ten_hc_khac, loai_hc, status, ten_latin, ten_ta, ten_tv, bpnc,
          trang_thai, mau, uv_sklm, diem_nong_chay, alpha_d, dung_moi_hoa_tan_tcvl,
          ctpt, klpt, hinh_cau_truc, cau_hinh_tuyet_doi, smiles, pho,
          dm_nmr_general, cart_coor, img_freq, te
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *
      `;

      const compoundValues = [
        compoundId,
        compoundData.tenHC || '',
        compoundData.tenHCKhac || null,
        compoundData.loaiHC || '',
        compoundData.status || '',
        compoundData.tenLatin || null,
        compoundData.tenTA || null,
        compoundData.tenTV || null,
        compoundData.bpnc || null,
        compoundData.trangThai || '',
        compoundData.mau || '',
        JSON.stringify(compoundData.uvSklm || { nm254: false, nm365: false }),
        compoundData.diemNongChay || null,
        compoundData.alphaD || null,
        compoundData.dungMoiHoaTanTCVL || null,
        compoundData.ctpt || '',
        compoundData.klpt || null,
        compoundData.hinhCauTruc || '',
        compoundData.cauHinhTuyetDoi || false,
        compoundData.smiles || null,
        JSON.stringify(compoundData.pho || {}),
        compoundData.dmNMRGeneral || null,
        compoundData.cartCoor || null,
        compoundData.imgFreq || null,
        compoundData.te || null
      ];

      await client.query(compoundQuery, compoundValues);

      // Insert NMR data block
      if (compoundData.nmrData) {
        const nmrQuery = `
          INSERT INTO nmr_data_blocks (id, compound_id, stt_bang, dm_nmr, tan_so_13c, tan_so_1h, luu_y_nmr, tltk_nmr)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        const nmrValues = [
          nmrDataBlockId,
          compoundId,
          compoundData.nmrData.sttBang || '',
          compoundData.nmrData.nmrConditions?.dmNMR || '',
          compoundData.nmrData.nmrConditions?.tanSo13C || '',
          compoundData.nmrData.nmrConditions?.tanSo1H || '',
          compoundData.nmrData.luuYNMR || '',
          compoundData.nmrData.tltkNMR || ''
        ];

        await client.query(nmrQuery, nmrValues);

        // Insert NMR signals
        if (compoundData.nmrData.signals && compoundData.nmrData.signals.length > 0) {
          for (const signal of compoundData.nmrData.signals) {
            const signalQuery = `
              INSERT INTO nmr_signals (id, nmr_data_block_id, vi_tri, scab, shac_j_hz)
              VALUES ($1, $2, $3, $4, $5)
            `;

            const signalValues = [
              signal.id || uuidv4(),
              nmrDataBlockId,
              signal.viTri || '',
              signal.scab || '',
              signal.shacJHz || ''
            ];

            await client.query(signalQuery, signalValues);
          }
        }
      }

      await client.query('COMMIT');

      // Return the created compound
      return await this.getCompoundById(compoundId) as CompoundData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateCompound(id: string, compoundData: Partial<CompoundData>): Promise<CompoundData | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if compound exists
      const existingCompound = await this.getCompoundById(id);
      if (!existingCompound) {
        return null;
      }

      // Update compound with JSONB fields
      const compoundQuery = `
        UPDATE compounds SET
          stt_hc = $2, ten_hc = $3, ten_hc_khac = $4, loai_hc = $5, status = $6,
          ten_latin = $7, ten_ta = $8, ten_tv = $9, bpnc = $10, trang_thai = $11,
          mau = $12, uv_sklm = $13, diem_nong_chay = $14, alpha_d = $15,
          dung_moi_hoa_tan_tcvl = $16, ctpt = $17, klpt = $18, hinh_cau_truc = $19,
          cau_hinh_tuyet_doi = $20, smiles = $21, pho = $22, dm_nmr_general = $23,
          cart_coor = $24, img_freq = $25, te = $26, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      const compoundValues = [
        id,
        compoundData.sttHC ?? existingCompound.sttHC,
        compoundData.tenHC ?? existingCompound.tenHC,
        compoundData.tenHCKhac ?? existingCompound.tenHCKhac,
        compoundData.loaiHC ?? existingCompound.loaiHC,
        compoundData.status ?? existingCompound.status,
        compoundData.tenLatin ?? existingCompound.tenLatin,
        compoundData.tenTA ?? existingCompound.tenTA,
        compoundData.tenTV ?? existingCompound.tenTV,
        compoundData.bpnc ?? existingCompound.bpnc,
        compoundData.trangThai ?? existingCompound.trangThai,
        compoundData.mau ?? existingCompound.mau,
        JSON.stringify(compoundData.uvSklm ?? existingCompound.uvSklm),
        compoundData.diemNongChay ?? existingCompound.diemNongChay,
        compoundData.alphaD ?? existingCompound.alphaD,
        compoundData.dungMoiHoaTanTCVL ?? existingCompound.dungMoiHoaTanTCVL,
        compoundData.ctpt ?? existingCompound.ctpt,
        compoundData.klpt ?? existingCompound.klpt,
        compoundData.hinhCauTruc ?? existingCompound.hinhCauTruc,
        compoundData.cauHinhTuyetDoi ?? existingCompound.cauHinhTuyetDoi,
        compoundData.smiles ?? existingCompound.smiles,
        JSON.stringify(compoundData.pho ?? existingCompound.pho),
        compoundData.dmNMRGeneral ?? existingCompound.dmNMRGeneral,
        compoundData.cartCoor ?? existingCompound.cartCoor,
        compoundData.imgFreq ?? existingCompound.imgFreq,
        compoundData.te ?? existingCompound.te
      ];

      await client.query(compoundQuery, compoundValues);

      // Update NMR data block if provided
      if (compoundData.nmrData) {
        const nmrQuery = `
          UPDATE nmr_data_blocks SET
            stt_bang = $2, dm_nmr = $3, tan_so_13c = $4, tan_so_1h = $5,
            luu_y_nmr = $6, tltk_nmr = $7, updated_at = CURRENT_TIMESTAMP
          WHERE compound_id = $1
        `;

        const nmrValues = [
          id,
          compoundData.nmrData.sttBang ?? existingCompound.nmrData.sttBang,
          compoundData.nmrData.nmrConditions?.dmNMR ?? existingCompound.nmrData.nmrConditions.dmNMR,
          compoundData.nmrData.nmrConditions?.tanSo13C ?? existingCompound.nmrData.nmrConditions.tanSo13C,
          compoundData.nmrData.nmrConditions?.tanSo1H ?? existingCompound.nmrData.nmrConditions.tanSo1H,
          compoundData.nmrData.luuYNMR ?? existingCompound.nmrData.luuYNMR,
          compoundData.nmrData.tltkNMR ?? existingCompound.nmrData.tltkNMR
        ];

        await client.query(nmrQuery, nmrValues);

        // Update NMR signals if provided
        if (compoundData.nmrData.signals) {
          // Delete existing signals
          await client.query('DELETE FROM nmr_signals WHERE nmr_data_block_id = (SELECT id FROM nmr_data_blocks WHERE compound_id = $1)', [id]);

          // Insert new signals
          for (const signal of compoundData.nmrData.signals) {
            const signalQuery = `
              INSERT INTO nmr_signals (id, nmr_data_block_id, vi_tri, scab, shac_j_hz)
              VALUES ($1, (SELECT id FROM nmr_data_blocks WHERE compound_id = $2), $3, $4, $5)
            `;

            const signalValues = [
              signal.id || uuidv4(),
              id,
              signal.viTri || '',
              signal.scab || '',
              signal.shacJHz || ''
            ];

            await client.query(signalQuery, signalValues);
          }
        }
      }

      await client.query('COMMIT');

      // Return the updated compound
      return await this.getCompoundById(id) as CompoundData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCompound(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM compounds WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async getNextSttHC(): Promise<number> {
    const result = await pool.query('SELECT COALESCE(MAX(stt_hc), 0) + 1 as next_stt_hc FROM compounds');
    return parseInt(result.rows[0].next_stt_hc);
  }

  // Metadata methods for dropdown values
  async getUniqueLoaiHCValues(): Promise<string[]> {
    const result = await pool.query('SELECT DISTINCT loai_hc FROM compounds WHERE loai_hc IS NOT NULL AND loai_hc != \'\' ORDER BY loai_hc');
    return result.rows.map(row => row.loai_hc);
  }

  async getUniqueTrangThaiValues(): Promise<string[]> {
    const result = await pool.query('SELECT DISTINCT trang_thai FROM compounds WHERE trang_thai IS NOT NULL AND trang_thai != \'\' ORDER BY trang_thai');
    return result.rows.map(row => row.trang_thai);
  }

  async getUniqueMauValues(): Promise<string[]> {
    const result = await pool.query('SELECT DISTINCT mau FROM compounds WHERE mau IS NOT NULL AND mau != \'\' ORDER BY mau');
    return result.rows.map(row => row.mau);
  }

  private async transformRowsToCompounds(rows: any[]): Promise<CompoundData[]> {
    const compoundsMap = new Map<string, CompoundData>();

    for (const row of rows) {
      if (!compoundsMap.has(row.id)) {
        // Parse JSONB fields
        const uvSklm = typeof row.uv_sklm === 'string' ? JSON.parse(row.uv_sklm) : row.uv_sklm || { nm254: false, nm365: false };
        const pho = typeof row.pho === 'string' ? JSON.parse(row.pho) : row.pho || {};

        // Create base compound
        const compound: CompoundData = {
          id: row.id,
          sttHC: row.stt_hc,
          tenHC: row.ten_hc,
          tenHCKhac: row.ten_hc_khac,
          loaiHC: row.loai_hc,
          status: row.status as CompoundStatus,
          tenLatin: row.ten_latin,
          tenTA: row.ten_ta,
          tenTV: row.ten_tv,
          bpnc: row.bpnc,
          trangThai: row.trang_thai,
          mau: row.mau,
          uvSklm,
          diemNongChay: row.diem_nong_chay,
          alphaD: row.alpha_d,
          dungMoiHoaTanTCVL: row.dung_moi_hoa_tan_tcvl,
          ctpt: row.ctpt,
          klpt: row.klpt,
          hinhCauTruc: row.hinh_cau_truc,
          cauHinhTuyetDoi: row.cau_hinh_tuyet_doi,
          smiles: row.smiles,
          pho,
          dmNMRGeneral: row.dm_nmr_general,
          cartCoor: row.cart_coor,
          imgFreq: row.img_freq,
          te: row.te,
          nmrData: {
            id: row.nmr_data_block_id || '',
            sttBang: row.stt_bang || '',
            nmrConditions: {
              id: uuidv4(),
              dmNMR: row.dm_nmr || '',
              tanSo13C: row.tan_so_13c || '',
              tanSo1H: row.tan_so_1h || ''
            },
            signals: [],
            luuYNMR: row.luu_y_nmr || '',
            tltkNMR: row.tltk_nmr || ''
          }
        };

        compoundsMap.set(row.id, compound);
      }

      // Add NMR signals if available
      if (row.nmr_data_block_id) {
        const signalsQuery = `
          SELECT id, vi_tri, scab, shac_j_hz
          FROM nmr_signals
          WHERE nmr_data_block_id = $1
          ORDER BY sort_order
        `;

        const signalsResult = await pool.query(signalsQuery, [row.nmr_data_block_id]);
        const signals: NMRSignalData[] = signalsResult.rows.map(signalRow => ({
          id: signalRow.id,
          viTri: signalRow.vi_tri,
          scab: signalRow.scab,
          shacJHz: signalRow.shac_j_hz
        }));

        const compound = compoundsMap.get(row.id)!;
        compound.nmrData.signals = signals;
      }
    }

    return Array.from(compoundsMap.values());
  }
}
