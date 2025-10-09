# REALTIME PERFORMANCE MONITORING GUIDE

**Date:** 2025-10-08
**Purpose:** Monitor and optimize websocket performance for Supabase Realtime

---

## OVERVIEW

This guide provides tools and techniques to monitor websocket connections, track realtime update speeds, and optimize performance for production deployments.

---

## 1. BROWSER DEVTOOLS MONITORING

### Check Websocket Connection Status

**Open Browser Console:**
```javascript
// 1. Check if Supabase Realtime is connected
// Look for this in console:
[Supabase Realtime] Connected

// 2. Monitor websocket messages
// Chrome DevTools → Network tab → Filter: WS (Websockets)
// Look for: wss://gwqkbjymbarkufwvdmar.supabase.co/realtime/v1/websocket
```

### Network Tab Analysis

1. Open **Chrome DevTools** (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSockets)
4. Look for: `websocket?apikey=...&vsn=1.0.0`
5. Click on the websocket connection
6. View **Messages** tab to see realtime traffic

**What to look for:**
- ✅ Connection established (Status: 101 Switching Protocols)
- ✅ Ping/pong messages (heartbeat every 30s)
- ✅ `postgres_changes` events when data updates
- ❌ Repeated reconnections (indicates network issues)
- ❌ High message frequency (may indicate too many subscriptions)

---

## 2. CONSOLE LOGGING FOR DEBUGGING

### Add Custom Logging to Hooks

**Method 1: Using onUpdate Callback**
```typescript
useProductionOrdersRealtime({
  queryKey: ['production-orders'],
  onUpdate: (payload) => {
    console.log('[Realtime] Production order updated:', {
      timestamp: new Date().toISOString(),
      eventType: payload.eventType, // INSERT, UPDATE, DELETE
      table: payload.table,
      newData: payload.new,
      oldData: payload.old,
    });
  },
});
```

**Method 2: Enhanced Logging Hook**
```typescript
// Create: /src/hooks/useRealtimeWithLogging.ts
import { useNotificationsRealtime } from './useRealtimeSubscription';
import { useEffect, useRef } from 'react';

export function useRealtimeWithPerformanceLogging(options: any) {
  const updateCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useNotificationsRealtime({
    ...options,
    onUpdate: (payload) => {
      updateCountRef.current++;
      const elapsed = Date.now() - startTimeRef.current;
      const updatesPerSecond = (updateCountRef.current / elapsed) * 1000;

      console.log('[Realtime Performance]', {
        totalUpdates: updateCountRef.current,
        elapsedMs: elapsed,
        avgUpdatesPerSecond: updatesPerSecond.toFixed(2),
        lastUpdate: payload,
      });

      options.onUpdate?.(payload);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[Realtime Stats]', {
        updates: updateCountRef.current,
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000) + 's',
      });
    }, 30000); // Log every 30s

    return () => clearInterval(interval);
  }, []);
}
```

---

## 3. PERFORMANCE METRICS TO TRACK

### Key Metrics

**1. Connection Latency**
- Time from subscription to first message
- **Target:** < 500ms

**2. Update Propagation Speed**
- Time from database change to UI update
- **Target:** < 1000ms (1 second)

**3. Message Frequency**
- Number of realtime updates per minute
- **Target:** < 100 updates/min per client

**4. Subscription Count**
- Number of active subscriptions per page
- **Target:** < 5 subscriptions per page

**5. Memory Usage**
- Browser memory consumption over time
- **Target:** Stable (no memory leaks)

### Measuring Update Speed

```typescript
// Add to component
const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

useProductionOrdersRealtime({
  queryKey: ['orders'],
  onUpdate: (payload) => {
    const now = Date.now();
    if (lastUpdateTime) {
      const timeSinceLastUpdate = now - lastUpdateTime;
      console.log(`Time between updates: ${timeSinceLastUpdate}ms`);
    }
    setLastUpdateTime(now);
  },
});
```

---

## 4. SUPABASE DASHBOARD MONITORING

### Access Realtime Metrics

1. **Go to:** https://app.supabase.com
2. **Select:** gwqkbjymbarkufwvdmar project
3. **Navigate to:** Database → Realtime Inspector
4. **View:**
   - Active connections
   - Messages per second
   - Subscription count
   - Error rates

### Realtime Quotas (Pro Plan)

- **Concurrent connections:** 500 (Pro plan)
- **Messages per second:** 500 (Pro plan)
- **Max message size:** 250KB

**If approaching limits:**
- Use filters to reduce subscriptions
- Batch updates instead of individual changes
- Consider pagination for large datasets

---

## 5. PRODUCTION MONITORING SETUP

### Custom Performance Monitor Component

```typescript
// /src/components/admin/RealtimeMonitor.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export function RealtimeMonitor() {
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<Date | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Monitor connection status
    const channel = supabase
      .channel('monitor')
      .on('system', { event: '*' }, (payload) => {
        if (payload.type === 'connected') setStatus('connected');
        if (payload.type === 'disconnected') setStatus('disconnected');
      })
      .subscribe();

    // Count all realtime messages
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes?.('[Supabase Realtime]')) {
        setMessageCount(c => c + 1);
        setLastMessage(new Date());
      }
      originalConsoleLog(...args);
    };

    return () => {
      channel.unsubscribe();
      console.log = originalConsoleLog;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={status === 'connected' ? 'text-success' : 'text-destructive'}>
            {status}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Messages Received:</span>
          <span>{messageCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Message:</span>
          <span>{lastMessage ? lastMessage.toLocaleTimeString() : 'None'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Add to Admin Dashboard:**
```tsx
import { RealtimeMonitor } from '@/components/admin/RealtimeMonitor';

// In admin page
<RealtimeMonitor />
```

---

## 6. COMMON PERFORMANCE ISSUES & SOLUTIONS

### Issue 1: Slow Update Propagation (> 2s)

**Symptoms:**
- UI updates appear delayed
- Multiple seconds between database change and UI update

**Causes:**
- Network latency
- Too many active subscriptions
- Heavy React re-renders

**Solutions:**
```typescript
// 1. Use React.memo to prevent unnecessary re-renders
const OrderItem = React.memo(({ order }) => {
  return <div>{order.name}</div>;
});

// 2. Debounce rapid updates
import { debounce } from 'lodash';

const debouncedUpdate = useCallback(
  debounce((payload) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, 500),
  []
);

useProductionOrdersRealtime({
  queryKey: ['orders'],
  onUpdate: debouncedUpdate,
});

// 3. Use more specific filters
useProductionOrdersRealtime({
  orderId: specificOrderId, // Only subscribe to one order
  queryKey: ['order', specificOrderId],
});
```

### Issue 2: High Memory Usage

**Symptoms:**
- Browser tab uses > 500MB RAM
- Performance degrades over time

**Causes:**
- Memory leaks from subscriptions
- Not cleaning up channels

**Solutions:**
```typescript
// ✅ CORRECT: Hook automatically cleans up
useProductionOrdersRealtime({
  queryKey: ['orders'],
  enabled: !!orderId, // Conditional subscription
});

// ❌ WRONG: Manual subscription without cleanup
useEffect(() => {
  const channel = supabase.channel('orders').subscribe();
  // Missing cleanup!
}, []);
```

### Issue 3: Too Many Websocket Connections

**Symptoms:**
- Browser console shows multiple websocket connections
- "Max connections exceeded" errors

**Causes:**
- Multiple instances of app open
- Not reusing connections

**Solutions:**
```typescript
// Supabase automatically reuses the same websocket connection
// across all channels. No action needed if using hooks correctly.

// Verify only ONE websocket in Network tab:
// Look for: wss://gwqkbjymbarkufwvdmar.supabase.co/realtime/v1/websocket
// Should see: 1 connection (not multiple)
```

### Issue 4: Subscription Not Working

**Symptoms:**
- No updates received
- `useRealtimeSubscription` not triggering

**Debugging Steps:**
```typescript
// 1. Add logging
useProductionOrdersRealtime({
  queryKey: ['orders'],
  onUpdate: (payload) => {
    console.log('✅ Realtime update received!', payload);
  },
});

// 2. Check RLS policies (Supabase dashboard)
// - Go to: Database → Policies
// - Verify SELECT policy exists for realtime
// - Test with SQL:
SELECT * FROM production_orders WHERE ... (your RLS conditions)

// 3. Verify table is enabled for realtime
// Run: npx ts-node scripts/verify-realtime-tables.ts
```

---

## 7. LOAD TESTING

### Test Script for Multiple Connections

```typescript
// /scripts/realtime-load-test.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NUM_CLIENTS = 50;
const channels: any[] = [];

async function loadTest() {
  console.log(`Starting load test with ${NUM_CLIENTS} simulated clients...`);

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const channel = supabase
      .channel(`test-client-${i}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_orders' },
        (payload) => {
          console.log(`Client ${i} received update:`, payload.eventType);
        }
      )
      .subscribe((status) => {
        console.log(`Client ${i} status:`, status);
      });

    channels.push(channel);
  }

  console.log(`All ${NUM_CLIENTS} clients subscribed. Monitoring for 60 seconds...`);

  await new Promise(resolve => setTimeout(resolve, 60000));

  channels.forEach(ch => ch.unsubscribe());
  console.log('Load test complete.');
}

loadTest();
```

**Run:**
```bash
npx ts-node scripts/realtime-load-test.ts
```

---

## 8. OPTIMIZATION CHECKLIST

### Before Production Deployment

- [ ] Verify websocket connection in browser console
- [ ] Test realtime updates with 2+ browser tabs
- [ ] Monitor memory usage over 30 minutes
- [ ] Check Supabase dashboard for connection count
- [ ] Confirm RLS policies are working correctly
- [ ] Test with slow network (Chrome DevTools → Network → Slow 3G)
- [ ] Verify cleanup (close tab, check connections decrease)
- [ ] Load test with expected user count

### Ongoing Monitoring

- [ ] Weekly: Check Supabase realtime metrics
- [ ] Monthly: Review browser console for errors
- [ ] Quarterly: Load test with growing user base

---

## 9. ALERTS & THRESHOLDS

### Set Up Monitoring Alerts

**Supabase Dashboard → Settings → Integrations:**
- Alert when concurrent connections > 400 (80% of limit)
- Alert when message rate > 400/sec (80% of limit)
- Alert when error rate > 5%

**Custom Application Monitoring:**
```typescript
// Add to global error handler
window.addEventListener('error', (event) => {
  if (event.message.includes('Realtime')) {
    // Send to error tracking (Sentry, etc.)
    console.error('[Realtime Error]', event);
  }
});
```

---

## 10. TROUBLESHOOTING COMMANDS

```bash
# Check Supabase realtime configuration
npx ts-node scripts/verify-realtime-tables.ts

# Monitor websocket in terminal
wscat -c "wss://gwqkbjymbarkufwvdmar.supabase.co/realtime/v1/websocket?apikey=YOUR_ANON_KEY&vsn=1.0.0"

# Check Node.js memory usage (if running SSR)
node --expose-gc index.js
# Then in console: global.gc(); process.memoryUsage()
```

---

## SUCCESS CRITERIA

**Healthy Realtime Performance:**
- ✅ Connection latency < 500ms
- ✅ Update propagation < 1000ms
- ✅ No memory leaks (stable over 1+ hours)
- ✅ < 5 subscriptions per page
- ✅ Clean disconnect on navigation
- ✅ Reconnects automatically on network loss

---

**Last Updated:** 2025-10-08
**Next Review:** Monthly
