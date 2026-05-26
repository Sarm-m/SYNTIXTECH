# DriveControl Data Management

## Purpose

The Data Management panel in `Configuracion -> Gestion de Datos` lets an authenticated user export, validate, import, template and reset operational data without touching authentication data.

Supported flows:

- Export JSON.
- Import JSON.
- Export Excel `.xlsx`.
- Import Excel `.xlsx`.
- Download empty JSON/Excel templates.
- Download JSON/Excel examples.
- Reset operational data after typing `RESTABLECER`.

Alerts are never imported or exported. They are calculated again from document expiration dates.

## JSON Structure

```json
{
  "version": "1.0",
  "exportedAt": "2026-05-22T00:00:00.000Z",
  "vehiculos": [],
  "conductores": [],
  "soats": [],
  "rtms": [],
  "validaciones": [],
  "preferences": {},
  "notes": "Las alertas no se exportan: se calculan automaticamente a partir de vencimientos."
}
```

Only these preferences are exported or imported:

- `syntix_threshold`
- `syntix_simulated_date`
- `syntix_dark_mode`

Old double-serialized values such as `"\"2026-05-22\""` are normalized to `2026-05-22`.

## Excel Structure

The Excel file is a real `.xlsx` workbook with these sheets:

- `Vehiculos`
- `Conductores`
- `SOAT`
- `RTM`
- `Validaciones`
- `Preferencias`
- `Instrucciones`

### Vehiculos

Columns:

- `placa`
- `marca`
- `modelo`
- `anio`
- `tipo`
- `conductorDocumento`

Rules:

- `placa` is required and normalized to uppercase.
- `anio` must be numeric when present.
- `conductorDocumento` is optional. Values such as `CC1000000001` are normalized to `1000000001` before matching drivers.

### Conductores

Columns:

- `nombre`
- `documento`
- `telefono`
- `categoria`
- `fechaVencimiento`

Rules:

- `nombre`, `documento`, `telefono`, `categoria` and `fechaVencimiento` are required.
- `documento` is normalized to 10 numeric digits. Prefixes such as `CC` and separators such as dots are removed.
- `telefono` is normalized to Colombian mobile format. Values such as `+57 3001110000` become `3001110000`.
- `fechaVencimiento` uses `YYYY-MM-DD`.
- Duplicate `documento` values are rejected.

### SOAT

Columns:

- `placa`
- `numeroPoliza`
- `aseguradora`
- `fechaExpedicion`
- `fechaInicioVigencia`
- `fechaFinVigencia`
- `observaciones`

Rules:

- `placa` and `numeroPoliza` are required.
- `placa` must exist in `Vehiculos`.
- Dates use `YYYY-MM-DD`.

### RTM

Columns:

- `placa`
- `numeroCertificado`
- `cda`
- `nitCda`
- `fechaExpedicion`
- `fechaVencimiento`
- `resultado`
- `observaciones`

Rules:

- `placa` is required and must exist in `Vehiculos`.
- `numeroCertificado` and `fechaVencimiento` are required.
- `fechaExpedicion` is required by the backend. When a generated backup has only `fechaVencimiento`, the app derives a safe issue date one year before expiration.
- `resultado` accepts `Aprobado`, `Rechazado` and `Pendiente`. `Requiere seguimiento` is normalized to `Pendiente`.
- Dates use `YYYY-MM-DD`; Excel serial dates are converted during import.

### Validaciones

Columns:

- `placa`
- `tipo`
- `estado`
- `fecha`
- `observaciones`

The import flow preserves the shape but operational creation still focuses on conductores, vehiculos, SOAT and RTM.

### Preferencias

Columns:

- `clave`
- `valor`

Any key outside the allowlist is ignored.

## Limits

- Maximum file size: 5 MB.
- Maximum vehicles: 500.
- Maximum drivers: 500.
- Maximum SOAT records: 1000.
- Maximum RTM records: 1000.
- Maximum validations: 1000.

## Validation

The UI validates before importing and shows a preview summary. It rejects:

- Malformed JSON.
- Invalid XLSX structure.
- Missing Excel sheets.
- Non-array JSON sections.
- Missing required columns or values.
- Invalid dates.
- Duplicate plates.
- Duplicate driver documents.
- SOAT/RTM records without plate.
- SOAT/RTM records tied to a missing vehicle plate.
- Oversized files.
- Sensitive fields.

## Security

The backup layer never exports or imports:

- `password`
- `token`
- `jwt`
- `accessToken`
- `refreshToken`
- `secret`
- `clientSecret`
- `EMAIL_PASS`
- `TWILIO_AUTH_TOKEN`
- `MONGO_URI`
- `JWT_SECRET`
- `.env`
- `ownerEmail`
- `ownerEmpresa`

If `ownerEmail` or `ownerEmpresa` appears in a file, it is ignored. Ownership is resolved by the authenticated user and backend session.

## Examples

Tracked JSON example:

- `docs/examples/drivecontrol-sample-backup.json`

Excel examples are generated from the app:

1. Go to `Configuracion -> Gestion de Datos`.
2. Open `Plantillas`.
3. Use `Ejemplo Excel`.

The generated Excel uses the same `DCV101` to `DCV110` dataset as the JSON example.

## Recommended Import Process

1. Export a current backup.
2. Download a template or example.
3. Prepare records in JSON or Excel.
4. Import the file.
5. Review the validation summary.
6. Fix any row errors before confirming.
7. Confirm import.
8. Review Vehiculos, Conductores, Documentos, Alertas and Dashboard.

## Reset

`Restablecer Datos` deletes operational records for the current user:

- validaciones
- SOAT
- RTM
- vehiculos
- conductores

It does not delete the user account, session token, credentials or authentication settings.
