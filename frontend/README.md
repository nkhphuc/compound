
# Compound Chemistry Data Manager - Backend Implementation Guide

## 1. Overview

This document provides a comprehensive guide for backend developers to build the necessary server-side infrastructure for the Compound Chemistry Data Manager application. The current application is a frontend-only prototype that uses `localStorage` for data persistence. The goal is to replace this with a robust backend service and database.

This guide outlines:
- **Database Schema:** A recommended database structure that mirrors the application's data models.
- **API Endpoints:** A complete specification of the RESTful API endpoints the frontend will consume.
- **Frontend Integration Points:** A list of specific files and functions in the frontend code that need to be modified to call the new API.
- **Data Migration:** A strategy for migrating existing data from `localStorage` to the new database.

---

## 2. Database Schema Design

The following schema is designed based on the data structures defined in `types.ts`. A relational database like PostgreSQL is recommended, especially for its robust support for `JSONB` data types.

### Table: `compounds`

This is the main table storing core information about each chemical compound.

```sql
CREATE TABLE compounds (
    id UUID PRIMARY KEY,
    stt_hc SERIAL NOT NULL UNIQUE, -- Auto-incrementing integer ID, equivalent to the old sttHC
    ten_hc VARCHAR(255) NOT NULL,
    ten_hc_khac VARCHAR(255),
    loai_hc VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'Mới' or 'Đã biết'
    ten_latin VARCHAR(255),
    ten_ta VARCHAR(255),
    ten_tv VARCHAR(255),
    bpnc TEXT,
    trang_thai VARCHAR(100) NOT NULL,
    mau VARCHAR(100) NOT NULL,
    uv_sklm JSONB, -- Stores { "nm254": boolean, "nm365": boolean }
    diem_nong_chay VARCHAR(100),
    alpha_d VARCHAR(100),
    dung_moi_hoa_tan_tcvl TEXT,
    ctpt TEXT NOT NULL,
    klpt VARCHAR(50),
    hinh_cau_truc TEXT, -- Stores URL to the uploaded image
    cau_hinh_tuyet_doi BOOLEAN DEFAULT FALSE,
    smiles TEXT,
    pho JSONB, -- Stores the spectral record object with URLs to files
    dm_nmr_general TEXT,
    cart_coor TEXT,
    img_freq VARCHAR(100),
    te VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `nmr_data_blocks`

Stores the main NMR data associated with a compound. This reflects the `NMRDataBlock` type and has a one-to-one relationship with the `compounds` table.

```sql
CREATE TABLE nmr_data_blocks (
    id UUID PRIMARY KEY,
    compound_id UUID NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
    stt_bang VARCHAR(50),
    dm_nmr TEXT, -- Solvent, from the nested NMRCondition
    tan_so_13c VARCHAR(50), -- 13C Frequency
    tan_so_1h VARCHAR(50), -- 1H Frequency
    luu_y_nmr TEXT, -- Notes
    tltk_nmr TEXT, -- References
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a unique index to enforce the one-to-one relationship
CREATE UNIQUE INDEX idx_unique_nmr_data_compound_id ON nmr_data_blocks(compound_id);
```

### Table: `nmr_signals`

Stores the individual NMR signal rows, linked to an `nmr_data_blocks` entry. This represents the `NMRSignalData` type.

```sql
CREATE TABLE nmr_signals (
    id UUID PRIMARY KEY,
    nmr_data_block_id UUID NOT NULL REFERENCES nmr_data_blocks(id) ON DELETE CASCADE,
    vi_tri VARCHAR(100), -- Position
    scab TEXT, -- δC value
    shac_j_hz TEXT, -- δH (J, Hz) value
    sort_order SERIAL -- To maintain the order of signals
);
```

---

## 3. API Endpoints Specification

The backend should expose a RESTful API. All endpoints should be prefixed (e.g., `/api`).

### 3.1. Compounds API

Handles CRUD operations for compounds.

- **`GET /api/compounds`**: Get a paginated list of compounds.
  - **Query Params:**
    - `?search=<term>` for filtering by `tenHC`, `sttHC`, or `loaiHC`.
    - `?page=<number>` (defaults to 1).
    - `?limit=<number>` (defaults to 10).
  - **Response Body:** `200 OK`
    ```json
    {
      "data": [
        { "id": "...", "sttHC": 1, "tenHC": "...", "loaiHC": "..." /* other summary fields */ }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 10,
        "totalItems": 100,
        "limit": 10
      }
    }
    ```

- **`GET /api/compounds/:id`**: Get full details for a single compound.
  - **Response Body:** `200 OK`
    - The full `CompoundData` object, with nested `nmrData`.

- **`POST /api/compounds`**: Create a new compound.
  - **Request Body:** The full `CompoundData` object. The backend should assign `id` and `sttHC`.
  - **Response Body:** `201 Created`
    - The newly created `CompoundData` object, including the server-assigned `id` and `sttHC`.

- **`PUT /api/compounds/:id`**: Update an existing compound.
  - **Request Body:** The full `CompoundData` object.
  - **Response Body:** `200 OK`
    - The updated `CompoundData` object.

- **`DELETE /api/compounds/:id`**: Delete a compound.
  - **Response Body:** `204 No Content`

### 3.2. File Uploads API

File uploads (structure images, spectra) should be handled separately to keep the compound payloads clean.

- **`POST /api/uploads`**: Upload a file.
  - **Request:** `multipart/form-data` with a single file.
  - **Response Body:** `200 OK`
    ```json
    {
      "url": "https://your-storage-provider.com/path/to/file.png"
    }
    ```
  - The frontend will use this URL to populate fields like `hinhCauTruc` or keys within the `pho` object before saving the compound.

### 3.3. Metadata API (Optional but Recommended)

To populate dropdowns efficiently without fetching all compounds.

- **`GET /api/meta/loai-hc`**: Get all unique `loaiHC` values.
- **`GET /api/meta/trang-thai`**: Get all unique `trangThai` values.
- **`GET /api/meta/mau`**: Get all unique `mau` values.

---

## 4. Frontend Integration Points

The following files and functions must be updated to use `fetch` (or a library like `axios`) to call the new API endpoints instead of interacting with `localStorage`.

### File: `services/compoundService.ts`

This service is the primary integration point and will require the most changes.

- **`getCompounds()`**:
  - **Current:** Reads all items from `localStorage`.
  - **New:** Should make a `GET` request to `/api/compounds`. It must pass `page`, `limit`, and `search` query parameters. The function signature and return type will change to handle the paginated response object from the API.

- **`getCompoundById(id)`**:
  - **Current:** Finds a compound in the `localStorage` array.
  - **New:** Should make a `GET` request to `/api/compounds/:id`.

- **`saveCompound(compoundToSave)`**:
  - **Current:** Differentiates new vs. existing by checking `id` and updates the `localStorage` array.
  - **New:**
    - If `compoundToSave` has an existing `id`, it should make a `PUT` request to `/api/compounds/:id`.
    - If it's a new compound, it should make a `POST` request to `/api/compounds`.

- **`deleteCompound(id)`**:
  - **Current:** Filters the array in `localStorage`.
  - **New:** Should make a `DELETE` request to `/api/compounds/:id`.

- **`getNextSttHC()`**:
  - **Current:** Calculates the next ID based on `localStorage` data.
  - **New:** This function should be **removed**. The backend will be responsible for assigning `sttHC`.

- **`getUniqueLoaiHCValues()`, `getUniqueTrangThaiValues()`, `getUniqueMauValues()`**:
  - **Current:** Derives values from all compounds in `localStorage`.
  - **New:** Should be updated to call the new metadata endpoints (e.g., `GET /api/meta/loai-hc`).

### File: `components/CompoundForm.tsx`

The file handling logic needs to be adapted.

- **`handleFileChange(e)`** (for structure image) & **`handleSpectralFileChange(fieldKey, e)`**:
  - **Current:** Reads the file as a Base64 `data:` URL and stores it in the component's state.
  - **New:**
    1. On file selection, immediately call the `POST /api/uploads` endpoint.
    2. Show a loading indicator for that input.
    3. On success, receive the `url` from the backend.
    4. Update the form state (e.g., `formData.hinhCauTruc`) with this new URL instead of the Base64 string.
    5. On failure, display an error message.

---

## 5. Data Migration Strategy

A one-time script (e.g., a Node.js script) will be needed to migrate data from the browser's `localStorage` to the new database.

**Process:**
1.  **Export from Browser:** From a client machine with existing data, open the browser's developer console and run:
    ```javascript
    copy(localStorage.getItem('compoundsData'));
    ```
    Paste the resulting JSON string into a file (e.g., `migration-data.json`).

2.  **Migration Script:** The backend script will:
    a. Read and parse `migration-data.json`.
    b. Iterate through each compound object in the array.
    c. For each compound:
        i. Handle file data: If `hinhCauTruc` or any `pho` fields are Base64 strings, the script must decode them and upload them to the file storage, replacing the Base64 string with the new URL.
        ii. Transform the flat object into the relational structure.
        iii. Insert a new row into the `compounds` table.
        iv. Using the `id` from the newly inserted compound, insert a corresponding row into `nmr_data_blocks`.
        v. Using the `id` from the new `nmr_data_blocks` row, insert all associated signal rows into the `nmr_signals` table.
    d. Execute this script once to populate the production database.
