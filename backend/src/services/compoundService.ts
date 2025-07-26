import { pool } from '../config/database.js';
import { CompoundData, CompoundStatus, SpectralRecord, NMRSignalData, NMRDataBlock } from '../types';
import { v4 as uuidv4 } from 'uuid';
// S3/MinIO imports and config
import { DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_CONFIG } from '../config/s3.js';

// Helper: extract S3 key from a file path
function extractS3KeyFromUrl(url: string): string | null {
  // Handle both legacy full URLs and new path-only format
  try {
    // If it's already just a path (starts with /compound-uploads/), extract the key
    if (url.startsWith('/compound-uploads/')) {
      const parts = url.split('/');
      if (parts.length >= 3) {
        return parts.slice(2).join('/'); // Return everything after /compound-uploads/
      }
      return null;
    }

    // Legacy support: if it's a full URL, try to extract the key
    // This handles any existing data that might have full URLs
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length >= 3 && pathParts[1] === S3_CONFIG.BUCKET) {
        return pathParts.slice(2).join('/'); // Return everything after the bucket name
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Helper: delete a file from S3/MinIO
async function deleteFileFromS3(key: string): Promise<void> {
  try {
    console.log(`S3 Cleanup - Attempting to delete file with key: ${key}`);
    console.log(`S3 Cleanup - Using bucket: ${S3_CONFIG.BUCKET}`);
    console.log(`S3 Cleanup - Using endpoint: ${S3_CONFIG.ENDPOINT}`);
    console.log(`S3 Cleanup - Using access key: ${S3_CONFIG.ACCESS_KEY}`);
    console.log(`S3 Cleanup - Using region: us-east-1`);
    console.log(`S3 Cleanup - Using forcePathStyle: true`);

    // Test S3 client connectivity first
    try {
      console.log(`S3 Cleanup - Testing S3 client connectivity...`);
      await s3Client.send(new HeadBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
      console.log(`S3 Cleanup - S3 client connectivity test successful`);
    } catch (connectErr) {
      console.error('S3 Cleanup - S3 client connectivity test failed:', connectErr);
      return;
    }

    const result = await s3Client.send(new DeleteObjectCommand({ Bucket: S3_CONFIG.BUCKET, Key: key }));
    console.log(`S3 Cleanup - Delete successful for key: ${key}`, result);
    console.log(`S3 Cleanup - Delete result metadata:`, result.$metadata);
  } catch (err) {
    // Log but don't throw, so DB ops aren't blocked by S3 errors
    console.error('S3 Cleanup - Failed to delete file from S3:', key, err);
    console.error('S3 Cleanup - Error details:', JSON.stringify(err, null, 2));
  }
}

// Helper function to handle both legacy single strings and new arrays
function getFileUrls(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

export class CompoundService {
  async getCompounds(options: { page: number; limit: number; searchTerm?: string; loaiHC?: string[]; status?: string[]; trangThai?: string[]; mau?: string[] }) {
    const { page, limit, searchTerm = '', loaiHC = [], status = [], trangThai = [], mau = [] } = options;
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

    // Build whereClauses for all filters
    const whereClauses: string[] = [];
    const queryParams: unknown[] = [];

    if (searchTerm) {
      whereClauses.push(`(c.ten_hc ILIKE $${queryParams.length + 1} OR c.stt_hc::text ILIKE $${queryParams.length + 1} OR c.loai_hc ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${searchTerm}%`);
    }
    if (loaiHC.length > 0) {
      whereClauses.push(`(${loaiHC.map((_, i) => `c.loai_hc = $${queryParams.length + i + 1}`).join(' OR ')})`);
      queryParams.push(...loaiHC);
    }
    if (status.length > 0) {
      whereClauses.push(`(${status.map((_, i) => `c.status = $${queryParams.length + i + 1}`).join(' OR ')})`);
      queryParams.push(...status);
    }
    if (trangThai.length > 0) {
      whereClauses.push(`(${trangThai.map((_, i) => `c.trang_thai = $${queryParams.length + i + 1}`).join(' OR ')})`);
      queryParams.push(...trangThai);
    }
    if (mau.length > 0) {
      whereClauses.push(`(${mau.map((_, i) => `c.mau = $${queryParams.length + i + 1}`).join(' OR ')})`);
      queryParams.push(...mau);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM compounds';
    const countParams: unknown[] = [];
    const countWhereClauses: string[] = [];
    let paramIdx = 1;
    if (searchTerm) {
      countWhereClauses.push(`(ten_hc ILIKE $${paramIdx} OR stt_hc::text ILIKE $${paramIdx} OR loai_hc ILIKE $${paramIdx})`);
      countParams.push(`%${searchTerm}%`);
      paramIdx++;
    }
    if (loaiHC.length > 0) {
      countWhereClauses.push(`(${loaiHC.map(() => `loai_hc = $${paramIdx++}`).join(' OR ')})`);
      countParams.push(...loaiHC);
    }
    if (status.length > 0) {
      countWhereClauses.push(`(${status.map(() => `status = $${paramIdx++}`).join(' OR ')})`);
      countParams.push(...status);
    }
    if (trangThai.length > 0) {
      countWhereClauses.push(`(${trangThai.map(() => `trang_thai = $${paramIdx++}`).join(' OR ')})`);
      countParams.push(...trangThai);
    }
    if (mau.length > 0) {
      countWhereClauses.push(`(${mau.map(() => `mau = $${paramIdx++}`).join(' OR ')})`);
      countParams.push(...mau);
    }
    if (countWhereClauses.length > 0) {
      countQuery += ' WHERE ' + countWhereClauses.join(' AND ');
    }
    const countResult = await pool.query(countQuery, countParams);
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

      // Insert compound with JSONB fields
      const compoundQuery = `
        INSERT INTO compounds (
          id, ten_hc, ten_hc_khac, loai_hc, status, ten_latin, ten_ta, ten_tv, bpnc, nguon_khac,
          trang_thai, mau, uv_sklm, diem_nong_chay, alpha_d, dung_moi_hoa_tan_tcvl,
          ctpt, klpt, hinh_cau_truc, cau_hinh_tuyet_doi, smiles, pho,
          dm_nmr_general, cart_coor, img_freq, te
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
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
        compoundData.nguonKhac || null,
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

      // Insert all NMR data blocks and their signals
      if (Array.isArray(compoundData.nmrData)) {
        for (const nmrBlock of compoundData.nmrData) {
          const nmrDataBlockId = nmrBlock.id || uuidv4();
          const nmrQuery = `
            INSERT INTO nmr_data_blocks (id, compound_id, stt_bang, dm_nmr, tan_so_13c, tan_so_1h, luu_y_nmr, tltk_nmr)
            VALUES ($1, $2, DEFAULT, $3, $4, $5, $6, $7)
          `;
          const nmrValues = [
            nmrDataBlockId,
            compoundId,
            nmrBlock.nmrConditions?.dmNMR || '',
            nmrBlock.nmrConditions?.tanSo13C || '',
            nmrBlock.nmrConditions?.tanSo1H || '',
            nmrBlock.luuYNMR || '',
            nmrBlock.tltkNMR || ''
          ];
          await client.query(nmrQuery, nmrValues);

          // Insert signals for this block
          if (nmrBlock.signals && nmrBlock.signals.length > 0) {
            for (const signal of nmrBlock.signals) {
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
      }

      await client.query('COMMIT');
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
      // --- S3 file cleanup logic ---
      // Check pho field for file changes
      const oldPho = existingCompound.pho || {};
      const newPho = compoundData.pho || {};

      for (const key of Object.keys(oldPho)) {
        const oldValue = oldPho[key as keyof SpectralRecord];
        const newValue = newPho[key as keyof SpectralRecord];

        console.log(`S3 Cleanup - Checking field ${key}: old="${oldValue}", new="${newValue}"`);

        // Get file URLs from both old and new values (handles both arrays and legacy strings)
        const oldFileUrls = getFileUrls(oldValue as string[] | string | undefined);
        const newFileUrls = getFileUrls(newValue as string[] | string | undefined);

        // Check each file in the old array
        for (const oldFile of oldFileUrls) {
          if (oldFile && (oldFile.startsWith('http') || oldFile.startsWith('/compound-uploads/'))) {
            // Check if this file still exists in the new array
            const fileStillExists = newFileUrls.includes(oldFile);
            if (!fileStillExists) {
              console.log(`S3 Cleanup - File removed for ${key}: ${oldFile}`);
              const s3Key = extractS3KeyFromUrl(oldFile);
              if (s3Key) {
                console.log(`S3 Cleanup - Deleting S3 key: ${s3Key}`);
                await deleteFileFromS3(s3Key);
              } else {
                console.log(`S3 Cleanup - Could not extract S3 key from URL: ${oldFile}`);
              }
            }
          }
        }
      }

      // Check Structure Image field (hinhCauTruc)
      const oldStructureImage = existingCompound.hinhCauTruc;
      const newStructureImage = compoundData.hinhCauTruc;

      console.log(`S3 Cleanup - Checking Structure Image: old="${oldStructureImage}", new="${newStructureImage}"`);

      if (oldStructureImage && (oldStructureImage.startsWith('http') || oldStructureImage.startsWith('/compound-uploads/')) && (!newStructureImage || newStructureImage !== oldStructureImage)) {
        console.log(`S3 Cleanup - Structure Image changed/removed: ${oldStructureImage}`);
        const s3Key = extractS3KeyFromUrl(oldStructureImage);
        if (s3Key) {
          console.log(`S3 Cleanup - Deleting S3 key: ${s3Key}`);
          await deleteFileFromS3(s3Key);
        } else {
          console.log(`S3 Cleanup - Could not extract S3 key from URL: ${oldStructureImage}`);
        }
      }
      // --- end S3 file cleanup logic ---

      // Update compound with JSONB fields
      const compoundQuery = `
        UPDATE compounds SET
          stt_hc = $2, ten_hc = $3, ten_hc_khac = $4, loai_hc = $5, status = $6,
          ten_latin = $7, ten_ta = $8, ten_tv = $9, bpnc = $10, nguon_khac = $11, trang_thai = $12,
          mau = $13, uv_sklm = $14, diem_nong_chay = $15, alpha_d = $16,
          dung_moi_hoa_tan_tcvl = $17, ctpt = $18, klpt = $19, hinh_cau_truc = $20,
          cau_hinh_tuyet_doi = $21, smiles = $22, pho = $23, dm_nmr_general = $24,
          cart_coor = $25, img_freq = $26, te = $27, updated_at = CURRENT_TIMESTAMP
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
        compoundData.nguonKhac ?? existingCompound.nguonKhac,
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
      // Delete all existing NMR data blocks and signals for this compound
      await client.query('DELETE FROM nmr_signals WHERE nmr_data_block_id IN (SELECT id FROM nmr_data_blocks WHERE compound_id = $1)', [id]);
      await client.query('DELETE FROM nmr_data_blocks WHERE compound_id = $1', [id]);
      // Insert all new NMR data blocks and their signals
      if (Array.isArray(compoundData.nmrData)) {
        for (const nmrBlock of compoundData.nmrData) {
          const nmrDataBlockId = nmrBlock.id || uuidv4();
          const nmrQuery = `
            INSERT INTO nmr_data_blocks (id, compound_id, stt_bang, dm_nmr, tan_so_13c, tan_so_1h, luu_y_nmr, tltk_nmr)
            VALUES ($1, $2, DEFAULT, $3, $4, $5, $6, $7)
          `;
          const nmrValues = [
            nmrDataBlockId,
            id,
            nmrBlock.nmrConditions?.dmNMR || '',
            nmrBlock.nmrConditions?.tanSo13C || '',
            nmrBlock.nmrConditions?.tanSo1H || '',
            nmrBlock.luuYNMR || '',
            nmrBlock.tltkNMR || ''
          ];
          await client.query(nmrQuery, nmrValues);
          // Insert signals for this block
          if (nmrBlock.signals && nmrBlock.signals.length > 0) {
            for (const signal of nmrBlock.signals) {
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
      }
      await client.query('COMMIT');
      return await this.getCompoundById(id) as CompoundData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCompound(id: string): Promise<boolean> {
    // --- S3 file cleanup logic ---
    // Fetch compound to get file URLs
    const compound = await this.getCompoundById(id);
    if (compound) {
      console.log('S3 Cleanup - Deleting compound files:', JSON.stringify(compound.pho));

      // Delete files from pho field
      if (compound.pho) {
        for (const key of Object.keys(compound.pho)) {
          const value = compound.pho[key as keyof SpectralRecord];

          // Get file URLs (handles both arrays and legacy strings)
          const fileUrls = getFileUrls(value as string[] | string | undefined);

          for (const fileUrl of fileUrls) {
            if (fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('/compound-uploads/'))) {
              console.log(`S3 Cleanup - Deleting file for ${key}: ${fileUrl}`);
              const s3Key = extractS3KeyFromUrl(fileUrl);
              if (s3Key) {
                console.log(`S3 Cleanup - Deleting S3 key: ${s3Key}`);
                await deleteFileFromS3(s3Key);
              } else {
                console.log(`S3 Cleanup - Could not extract S3 key from URL: ${fileUrl}`);
              }
            }
          }
        }
      }

      // Delete Structure Image file
      if (compound.hinhCauTruc && (compound.hinhCauTruc.startsWith('http') || compound.hinhCauTruc.startsWith('/compound-uploads/'))) {
        console.log(`S3 Cleanup - Deleting Structure Image: ${compound.hinhCauTruc}`);
        const s3Key = extractS3KeyFromUrl(compound.hinhCauTruc);
        if (s3Key) {
          console.log(`S3 Cleanup - Deleting S3 key: ${s3Key}`);
          await deleteFileFromS3(s3Key);
        } else {
          console.log(`S3 Cleanup - Could not extract S3 key from URL: ${compound.hinhCauTruc}`);
        }
      }
    }
    // --- end S3 file cleanup logic ---
    const result = await pool.query('DELETE FROM compounds WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async getNextSttHC(): Promise<number> {
    const result = await pool.query('SELECT COALESCE(MAX(stt_hc), 0) + 1 as next_stt_hc FROM compounds');
    return parseInt(result.rows[0].next_stt_hc);
  }

  async getNextSttBang(): Promise<number> {
    const result = await pool.query('SELECT COALESCE(MAX(stt_bang), 0) + 1 as next_stt_bang FROM nmr_data_blocks');
    return parseInt(result.rows[0].next_stt_bang);
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

  private async transformRowsToCompounds(rows: Record<string, unknown>[]): Promise<CompoundData[]> {
    const compoundsMap = new Map<string, CompoundData>();
    const nmrBlocksMap = new Map<string, NMRDataBlock[]>();
    // First, fetch all nmr_data_blocks for all compounds in the rows
    const compoundIds = Array.from(new Set(rows.map(row => row.id as string)));
    if (compoundIds.length > 0) {
      const nmrBlocksResult = await pool.query(
        `SELECT * FROM nmr_data_blocks WHERE compound_id = ANY($1::uuid[]) ORDER BY stt_bang ASC`,
        [compoundIds]
      );
      // For each nmr_data_block, fetch its signals
      for (const nmrBlockRow of nmrBlocksResult.rows) {
        const signalsResult = await pool.query(
          `SELECT id, vi_tri, scab, shac_j_hz FROM nmr_signals WHERE nmr_data_block_id = $1 ORDER BY sort_order`,
          [nmrBlockRow.id]
        );
        const signals: NMRSignalData[] = signalsResult.rows.map(signalRow => ({
          id: signalRow.id,
          viTri: signalRow.vi_tri,
          scab: signalRow.scab,
          shacJHz: signalRow.shac_j_hz
        }));
        const nmrBlock: NMRDataBlock = {
          id: nmrBlockRow.id,
          sttBang: nmrBlockRow.stt_bang ? nmrBlockRow.stt_bang.toString() : '',
          nmrConditions: {
            id: uuidv4(),
            dmNMR: nmrBlockRow.dm_nmr || '',
            tanSo13C: nmrBlockRow.tan_so_13c || '',
            tanSo1H: nmrBlockRow.tan_so_1h || ''
          },
          signals,
          luuYNMR: nmrBlockRow.luu_y_nmr || '',
          tltkNMR: nmrBlockRow.tltk_nmr || ''
        };
        if (!nmrBlocksMap.has(nmrBlockRow.compound_id)) {
          nmrBlocksMap.set(nmrBlockRow.compound_id, []);
        }
        nmrBlocksMap.get(nmrBlockRow.compound_id)!.push(nmrBlock);
      }
    }
    for (const row of rows) {
      if (!compoundsMap.has(row.id as string)) {
        // Parse JSONB fields
        const uvSklm = typeof row.uv_sklm === 'string' ? JSON.parse(row.uv_sklm as string) : row.uv_sklm || { nm254: false, nm365: false };
        const pho = typeof row.pho === 'string' ? JSON.parse(row.pho as string) : row.pho || {};
        const compound: CompoundData = {
          id: row.id as string,
          sttHC: row.stt_hc as number,
          tenHC: row.ten_hc as string,
          tenHCKhac: row.ten_hc_khac as string | undefined,
          loaiHC: row.loai_hc as string,
          status: row.status as CompoundStatus,
          tenLatin: row.ten_latin as string | undefined,
          tenTA: row.ten_ta as string | undefined,
          tenTV: row.ten_tv as string | undefined,
          bpnc: row.bpnc as string | undefined,
          nguonKhac: row.nguon_khac as string | undefined,
          trangThai: row.trang_thai as string,
          mau: row.mau as string,
          uvSklm,
          diemNongChay: row.diem_nong_chay as string | undefined,
          alphaD: row.alpha_d as string | undefined,
          dungMoiHoaTanTCVL: row.dung_moi_hoa_tan_tcvl as string | undefined,
          ctpt: row.ctpt as string,
          klpt: row.klpt as string | undefined,
          hinhCauTruc: row.hinh_cau_truc as string,
          cauHinhTuyetDoi: row.cau_hinh_tuyet_doi as boolean,
          smiles: row.smiles as string | undefined,
          pho,
          dmNMRGeneral: row.dm_nmr_general as string | undefined,
          cartCoor: row.cart_coor as string | undefined,
          imgFreq: row.img_freq as string | undefined,
          te: row.te as string | undefined,
          nmrData: nmrBlocksMap.get(row.id as string) || []
        };
        compoundsMap.set(row.id as string, compound);
      }
    }
    return Array.from(compoundsMap.values());
  }
}
