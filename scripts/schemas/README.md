# Schemas

The schemas `npm run check:repo` validates the repository's metadata files
against, copied byte for byte from where they are published, so the check
needs no network. Formatters leave this folder alone.

| File                          | Validates                | Source                                                                                                                                                                   | Licence                                                                                                       |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `dependabot-2.0.json`         | `.github/dependabot.yml` | [SchemaStore](https://github.com/SchemaStore/schemastore/blob/d227d9f54eaf1a805de6c00e94c939f526a3da2f/src/schemas/json/dependabot-2.0.json), commit `d227d9f`, 2026-10-22 | Apache-2.0                                                                                                    |
| `openvex-0.2.0.json`          | `vex.openvex.json`       | [openvex/spec](https://github.com/openvex/spec/blob/a68ccd19b15a9604d28ef66ebf33f27a772ba4ec/openvex_json_schema.json), commit `a68ccd1`, the latest change to the schema | CC0-1.0                                                                                                       |
| `security-insights-2.2.0.cue` | `security-insights.yml`  | [ossf/security-insights](https://github.com/ossf/security-insights/blob/v2.2.0/spec/schema.cue), tag `v2.2.0`; validated with `cue vet`, as its README says              | [Community Specification License 1.0](https://github.com/ossf/security-insights/blob/v2.2.0/LICENSE) |

To update one, download it from the same place at a newer commit or tag,
update the table, and run `npm run check:repo`. When `security-insights.yml`
moves to a new `schema-version`, update the CUE schema with it.
