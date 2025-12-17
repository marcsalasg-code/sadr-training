# Release Gate — Manual QA Checklist

**Duration**: ≤15 minutes  
**When**: Before every production deploy  
**Who**: Any team member with app access

---

## A) Smoke Tests

- [ ] App loads without white screen
- [ ] Login works (cloud or local)
- [ ] Dashboard shows athlete data

---

## B) Sync Integrity

### 1. Abort Real
**Steps**: Start sync → Navigate away immediately  
**Expected**: 
- `ABORT` log in console/recorder
- No error status
- No stale mutation

### 2. Watchdog
**Steps**: Throttle network via DevTools (Slow 3G) → Trigger sync  
**Expected**:
- `WATCHDOG` log after 45s
- Status transitions to `error`
- Not stuck in `syncing`

### 3. Offline Queue
**Steps**: Enable airplane mode → Create 2 athletes → Disable airplane mode  
**Expected**:
- Auto-push on reconnect
- Athletes visible in cloud

---

## C) Data Consistency

### 1. Legacy Plan
**Steps**: Open a training plan created before Phase 25  
**Expected**: Calendar sessions show exercises (not empty)

### 2. Auth Dissonance
**Steps**: Clear `sb-*` keys from localStorage while app open → Attempt sync  
**Expected**: 
- Clean redirect to login, OR
- Explicit auth error (no infinite loop)

---

## NO-GO Signals (Block Deploy)

❌ Uncaught exception in console  
❌ `syncing` state > 60 seconds  
❌ Visible data loss or corruption  
❌ White screen / React error boundary triggered  

---

## Sign-Off

| Item | Status | Tester | Date |
|------|--------|--------|------|
| Smoke | ☐ | | |
| Sync Integrity | ☐ | | |
| Data Consistency | ☐ | | |

**APPROVED FOR DEPLOY**: ☐
