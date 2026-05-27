# Backup y Restauración

## Backup creado

**Archivo:** `backup_pre_migration_20260527_094631.dump`
**Fecha:** 2026-05-27 09:46:32
**Tamaño:** ~99KB
**Formato:** Custom (compressed)
**TOC Entries:** 271
**DB Version:** PostgreSQL 18.3

## Comandos

### Backup
```powershell
$env:PGPASSWORD = 'toor'
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
  -h localhost -p 5432 -U postgres -d postgres `
  -F c -f backup_pre_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump
```

### Verificar integridad
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --list backup_pre_migration_20260527_094631.dump
```

### Restaurar (en caso de rollback)
```powershell
$env:PGPASSWORD = 'toor'
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" `
  -h localhost -p 5432 -U postgres -d postgres `
  --clean --if-exists backup_pre_migration_20260527_094631.dump
```

**Nota:** El backup está en el directorio raíz del proyecto (`C:\Users\Duv\Code\aure-app\`).
