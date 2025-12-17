# SADR Training OS — Sync QA Checklist

> **Phase 24: Sync Hardening + Snapshot Closure**

---

## Pre-Test Setup

1. [ ] Vercel deployment is up to date
2. [ ] Have two devices ready (PC = Device A, Mobile = Device B)
3. [ ] Both devices logged into same Supabase account

---

## Gate 1: Basic Sync Flow

### Push Test
1. [ ] On Device A: Create new athlete "Test Sync"
2. [ ] Observe console logs: `[Sync:xxxxxxxx] [START]` message appears
3. [ ] Wait 5-10s for auto-sync or trigger manually
4. [ ] Observe console: `[Sync:xxxxxxxx] [PUSH] Push complete` with counts

### Pull Test
1. [ ] On Device B: Refresh page or wait for auto-sync
2. [ ] Observe console: `[Sync:xxxxxxxx] [PULL] Auto-pull complete`
3. [ ] Verify "Test Sync" athlete appears on Device B

---

## Gate 2: Abort Handling

### Trigger Abort
1. [ ] On Device A: Make a change (edit athlete name)
2. [ ] Immediately navigate to different page
3. [ ] Observe console: `[Sync:--] [ABORT] Cancelling previous sync cycle`
4. [ ] Verify: No "error" status shown in UI
5. [ ] Verify: `syncSlice.status` returns to 'idle'

### No Stuck Status
1. [ ] Open DevTools: `window.__TRAINING_STORE.getState().status`
2. [ ] Should be `'idle'` (not `'syncing'`)

---

## Gate 3: Conflict Detection

### Create Conflict
1. [ ] Device A: Go offline (disable network)
2. [ ] Device A: Change athlete name to "Offline A"
3. [ ] Device B: Change same athlete name to "Online B"
4. [ ] Device B: Wait for sync (should push)
5. [ ] Device A: Go online

### Expected Behavior
1. [ ] Device A attempts push
2. [ ] Device A detects remote is newer
3. [ ] Console: `[Sync:xxxxxxxx] [CONFLICT] Remote newer but local dirty`
4. [ ] UI shows conflict indicator (if implemented)

---

## Gate 4: Template Snapshot (Implicit)

### Verify Template Clone
1. [ ] Create Template "Test Template" with 3 exercises
2. [ ] Create Session from this template
3. [ ] Modify "Test Template" (add or remove exercise)
4. [ ] Open the previously created Session
5. [ ] Verify: Session still has original 3 exercises (not modified)

---

## Gate 5: Delta Scenarios (Phase 25 Audit)

### Abort Propagation (Double Sync)
1. [ ] Trigger manual sync. Immediately trigger again (double click).
2. [ ] Verify console shows 1 ABORT and 1 START/END.
3. [ ] Verify `__debugDirtyTrackingCheck()` shows no data corruption.

### Auth Dissonance
1. [ ] Log in Device A.
2. [ ] In Supabase Dashboard > Auth > Users: Revoke refresh token for this user (or delete session).
3. [ ] Device A: Attempt changes/sync.
4. [ ] Expected: Sync Error (401/403) -> UI handles gracefully (no infinite loop).

### Offline Write Queue
1. [ ] Device A Offline.
2. [ ] Create Athlete "Offline 1".
3. [ ] Create Template "Offline 2".
4. [ ] Update Settings (pin).
5. [ ] Connect Online. Wait for sync.
6. [ ] Verify all 3 entities pushed in one batch (counts: athletes:1, templates:1, etc.).

### Navigation Mid-Sync
1. [ ] Start Sync (throttle network speed in DevTools to "Slow 3G").
2. [ ] Immediately click unrelated sidebar link (e.g. Analytics).
3. [ ] Verify: `[ABORT]` log.
4. [ ] Verify: Sync status resets to `idle`.

### Race Condition (Torture Test)
1. [ ] Open Console.
2. [ ] Run loop: `for(let i=0;i<5;i++) window.dispatchEvent(new Event('focus'))`
3. [ ] Expected: 4 ABORT logs, 1 START/END log (last one wins).

---

## Logs Reference

| Phase | Console Pattern | Meaning |
|-------|-----------------|---------|
| START | `[Sync:xxx] [START]` | New sync cycle started |
| PUSH | `[Sync:xxx] [PUSH]` | Pushing local changes |
| CHECK | `[Sync:xxx] [CHECK]` | Checking remote timestamp |
| PULL | `[Sync:xxx] [PULL]` | Pulling remote changes |
| CONFLICT | `[Sync:xxx] [CONFLICT]` | Local dirty + remote newer |
| ABORT | `[Sync:--] [ABORT]` | Previous cycle cancelled |
| END | `[Sync:xxx] [END]` | Cycle completed |

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Sync never triggers | Verify coach role login |
| Stuck on 'syncing' | Check `window.__TRAINING_STORE.getState().status` |
| No logs visible | Check `import.meta.env.DEV` is true |
