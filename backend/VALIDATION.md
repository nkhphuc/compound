# Backend Validation Implementation

This document describes the validation system implemented in the backend that **exactly mirrors** the frontend validation rules.

## 🎯 **Validation Philosophy**

The backend validation is designed to be **identical** to frontend validation, ensuring:

- **Consistent user experience** - Same validation rules on both ends
- **Data integrity** - Server-side protection against invalid data
- **Security** - Protection against malicious requests
- **Error consistency** - Same error messages as frontend

## 📋 **Validation Rules (Mirroring Frontend)**

### **Required Fields**

1. **`tenHC`** - Compound Name
   - Must be non-empty string
   - Error: "Compound Name is required."

2. **`status`** - Compound Status
   - Must be one of: `'Mới'`, `'Đã biết'`, `''`
   - Error: "Compound Status is required."

3. **`loaiHC`** - Compound Type
   - Must be non-empty string
   - Error: "Compound Type is required."

4. **`trangThai`** - State/Phase
   - Must be non-empty string
   - Error: "State/Phase is required."

5. **`mau`** - Color
   - Must be non-empty string
   - Error: "Color is required."

### **URL Validation**

1. **`hinhCauTruc`** - Structure Image URL
   - If provided, must start with 'http'
   - Error: "Please enter a valid HTTP/S URL for the image."

2. **`pho.*`** - Spectral Data URLs
   - If provided, must start with 'http'
   - Error: "Please enter a valid HTTP/S URL."

### **Data Type Validation**

1. **`sttHC`** - Serial Number
   - Must be integer ≥ 0
   - Defaults to 0

2. **`uvSklm.nm254`** and **`uvSklm.nm365`**
   - Must be boolean
   - Default to false

3. **`cauHinhTuyetDoi`**
   - Must be boolean
   - Defaults to false

### **File Upload Validation**

1. **File Size** - Maximum 50MB
2. **File Types** - Images, PDFs, documents only
3. **Single File** - Only one file per upload

## 🔧 **Implementation Details**

### **Validation Middleware**

- **`validateCompound`** - Validates compound data for POST/PUT requests
- **`validateQueryParams`** - Validates pagination and search parameters
- **`validateId`** - Validates UUID format for ID parameters
- **`validateFileUpload`** - Validates file uploads

### **Error Response Format**

```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": {
    "tenHC": "Compound Name is required.",
    "status": "Compound Status is required.",
    "hinhCauTruc": "Please enter a valid HTTP/S URL for the image."
  }
}
```

### **Routes with Validation**

- `POST /api/compounds` - `validateCompound`
- `PUT /api/compounds/:id` - `validateId` + `validateCompound`
- `GET /api/compounds` - `validateQueryParams`
- `GET /api/compounds/:id` - `validateId`
- `DELETE /api/compounds/:id` - `validateId`
- `POST /api/uploads` - `validateFileUpload`

## 🧪 **Testing Validation**

### **Test Required Fields**

```bash
curl -X POST http://localhost:3001/api/compounds \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Test URL Validation**

```bash
curl -X POST http://localhost:3001/api/compounds \
  -H "Content-Type: application/json" \
  -d '{
    "tenHC": "Test",
    "status": "Mới",
    "loaiHC": "Test",
    "trangThai": "Test",
    "mau": "Test",
    "hinhCauTruc": "invalid-url"
  }'
```

### **Test File Upload**

```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "file=@test.txt"
```

## 🔄 **Frontend Integration**

The frontend will receive validation errors in the same format as its own validation, making error handling seamless:

```typescript
// Frontend error handling remains the same
if (response.validationErrors) {
  setFormErrors(response.validationErrors);
  return;
}
```

## 🛡️ **Security Benefits**

1. **Input Sanitization** - All inputs are trimmed and validated
2. **Type Safety** - Ensures correct data types
3. **File Security** - Validates file types and sizes
4. **SQL Injection Protection** - Validated data prevents injection
5. **XSS Protection** - Input sanitization prevents XSS

## 📝 **Maintenance**

To update validation rules:

1. Update the frontend validation in `CompoundForm.tsx`
2. Update the corresponding Joi schema in `validation.ts`
3. Test both frontend and backend validation
4. Update this documentation

## ✅ **Validation Coverage**

- ✅ **Compound Creation** - Full validation
- ✅ **Compound Updates** - Full validation
- ✅ **File Uploads** - Type, size, security validation
- ✅ **Query Parameters** - Pagination and search validation
- ✅ **ID Parameters** - UUID format validation
- ✅ **Error Messages** - Consistent with frontend
