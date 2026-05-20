# 23 · PHASE_THEME2_FOUNDATION

**Baseline:** `STABLE_23_MULTI_WORKSPACE_V1` (unchanged)  
**Policy:** UI/theme layer only · engine `bindSymbol` sessions preserved

## Delivered

| Item | Implementation |
|------|----------------|
| THEME1/THEME2 toggle | `ThemeToggle` · `tether23.theme_v1` |
| THEME2 layout | `Theme2Shell` + `Theme2FloatPane` |
| Detachable-only | THEME2 panels default `detached: true`, zone `float` |
| Multi chart | `chart1` · `chart2` · `chart3` mock panels |
| Floating DOM | portal `FloatingPanel` on all THEME2 panels |
| Preset split | `theme2-ultra` · `theme2-multi-chart` vs THEME1 presets |
| Ultra compact | `theme2-root ultra-compact` |
| Theme persistence | `themeStorage.ts` |
| Panel config split | `tether23.workspace.theme1_v1` / `theme2_v1` |

## Code map

| Path | Role |
|------|------|
| `src/theme/` | types, storage, theme2Presets |
| `src/app/ThemeContext.tsx` | active theme |
| `src/ui/theme/ThemeRootShell.tsx` | routes theme1 vs theme2 |
| `src/ui/theme/Theme2Shell.tsx` | THEME2 chrome |
| `src/ui/theme/Theme2FloatPane.tsx` | floating trading surface |

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
