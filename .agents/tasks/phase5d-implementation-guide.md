# Phase 5d — Implementation Guide

**Status:** Patterns documented; deferring to Phase 6 for higher business value

## Button Migration Patterns (5 Categories)

All ~35 buttons across admin components follow these 5 patterns:

### 1. Submit/Cancel (Primary/Secondary action pair)
Pattern: `<button type="submit">` + `<button type="button" onClick={onClose}>`  
Migrate to: `<Button type="submit">` + `<Button type="button" variant="outline">`

### 2. Icon-Only (Edit/Delete/Toggle)
Pattern: `<button><Icon /></button>` with hover styling
Migrate to: `<Button variant="ghost" size="icon"><Icon /></Button>`

### 3. Action Buttons (Approve/Reject)
Pattern: `<button className="bg-emerald-700...">` or `bg-red-700`
Migrate to: `<Button variant="default">` or `<Button variant="destructive">`

### 4. Filter/Toggle Buttons
Pattern: `<button className={condition ? 'bg-rose-700' : 'bg-slate-800'}>`
Migrate to: `<Button variant={condition ? "default" : "outline"}>`

### 5. Ghost Buttons (New/Add)
Pattern: `<button className="text-rose-400 hover:text-rose-300">`
Migrate to: `<Button variant="ghost" size="sm">`

## Implementation (For Later)

Each file can be processed:
1. SuperAdminClient.tsx (~15 buttons)
2. CityAdminClient.tsx (~12 buttons, same patterns)
3. KendraClient.tsx (~8 buttons, same patterns)

All patterns are mechanical and low-risk since they only change styling/component wrapper, not logic.

## Current Decision

**Proceed with Phase 6 instead** — Higher business impact on customer-facing flows (CatalogBrowser, CheckoutClient).
