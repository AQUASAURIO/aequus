# Task 5-a: Update NewValuationView and PropertyDetailView for country field and DR provinces

## Files Changed

### 1. `src/components/valuation/NewValuationView.tsx`
- **Imports**: Added `Globe` to lucide-react import; added `countries`, `getRegionsForCountry` to types import
- **Form schema**: Added `country` field (`z.string().min(2)`) before `city` field
- **Default values**: Added `country: "DO"` to form defaults
- **Removed**: Hardcoded `mexicanStates` array (no longer needed)
- **State**: Added `selectedCountry` state initialized to `"DO"`
- **Step 1 form**: Added country/region selector row (2-col grid with Globe-labeled country dropdown + "Provincia / Estado" dropdown using `getRegionsForCountry`). Changed city/zipCode grid from 3-col to 2-col (state removed from that grid since it's now above)
- **Validation**: Updated step 1 trigger to include `"country"`
- **MapPicker callback**: Added `data.country` → form.setValue("country") guard
- **Step 3 summary**: Added country flag emoji before city/state display

### 2. `src/components/valuation/PropertyDetailView.tsx`
- **Imports**: Added `Globe` to lucide-react; added `countries` to types import
- **demoProperty**: Added `country: "DO"` field after zipCode
- **handleMapLocationUpdate**: Added `country: (data as any).country || prev.country || "DO"` with fallback
- **Property header**: Added country flag span after city/state/zipCode display

## Lint Result
- `bun run lint` → **0 errors**, clean pass
