# One-Letter-At-A-Time Input Bug - Root Cause Identified

## Symptoms
- Form inputs lose focus after typing ONE character
- User must re-click input field for each subsequent character
- Affects ALL Input components using React Hook Form's `{...register()}`

## Root Cause
**React Hook Form's `register()` method** combined with shadcn/ui `Input` component (which uses `forwardRef`) causes unexpected re-rendering that loses input focus on every keystroke.

## Proof
Playwright test results:
- ❌ **With `{...register('businessName')}`**: Only "D" entered (FAILS)
- ✅ **With plain HTML `<input>`**: Full "Disaster Recovery" entered (PASSES)

## Solution
Replace `register()` with `Controller` from React Hook Form for proper controlled input handling.

### Before (BROKEN):
```tsx
<Input
  {...register('businessName')}
  placeholder="Enter your business name"
/>
```

### After (FIXED):
```tsx
<Controller
  name="businessName"
  control={control}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Enter your business name"
    />
  )}
/>
```

## Files Affected
- `components/onboarding/ClientIntakeFormV2.tsx` (ALL Input fields)
- ALL forms using React Hook Form + shadcn/ui Input component

## Test Evidence
```
✅ Typed value: "Disaster Recovery"
✅ Expected: "Disaster Recovery"
✅ Match: true
  ok 1 tests\onboarding-form-input.spec.ts:10:5 › should allow typing multiple characters in business name field (3.6s)
```

## Next Steps
1. Import `Controller` from react-hook-form
2. Replace ALL `{...register()}` usage with Controller pattern
3. Re-run Playwright tests to confirm fix across all fields
