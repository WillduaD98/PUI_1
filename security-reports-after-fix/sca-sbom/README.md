# SBOM (Software Bill of Materials) - PUI_1

Generado en respuesta al reporte SCA para remitir el inventario completo de
componentes evaluados en formato estándar.

## Archivos

- `sbom-root.json` — SBOM del proyecto raíz (`package.json` / `package-lock.json` en `/`). 94 componentes (final, 2026-07-07, tras eliminar `@apollo/client` y actualizar todas las dependencias a su última versión).
- `sbom-server.json` — SBOM del backend (`server/package.json` / `server/package-lock.json`). 192 componentes (final, 2026-07-07, tras actualizar todas las dependencias a su última versión y remover `@types/mongoose`, deprecado).
- `generated-at.txt` — timestamp UTC y versiones de node/npm/herramienta usadas para la generación original.

**Estado final:** `npm outdated` no reporta ninguna dependencia desactualizada
en ningún proyecto; `npm audit` reporta 0 vulnerabilidades en ambos. Ver
`../evidencias-complementarias/evaluacion-dependencias-mayores_20260707.md`
para el detalle de cada actualización y su verificación.

## Formato

- **Estándar:** CycloneDX
- **Versión de especificación:** 1.6
- **Serialización:** JSON

## Herramienta y comando

Generado con la herramienta oficial `@cyclonedx/cyclonedx-npm` (paquete con
scope oficial de OWASP CycloneDX; el paquete `cyclonedx-npm` sin scope es un
placeholder de dependency-confusion y no debe usarse).

```bash
# Raíz del repo
npx --yes @cyclonedx/cyclonedx-npm \
  --output-format JSON \
  --output-file security-reports-after-fix/sca-sbom/sbom-root.json \
  --package-lock-only

# Backend (server/)
cd server && npx --yes @cyclonedx/cyclonedx-npm \
  --output-format JSON \
  --output-file ../security-reports-after-fix/sca-sbom/sbom-server.json \
  --package-lock-only
```

`--package-lock-only` construye el árbol de dependencias a partir del
`package-lock.json` (no requiere `node_modules` instalado), garantizando que
el inventario refleje exactamente las versiones resueltas y congeladas del
lockfile.

## Validación

Cada archivo fue validado como CycloneDX bien formado (`bomFormat: CycloneDX`,
`specVersion: 1.6`) antes de remitirse.
