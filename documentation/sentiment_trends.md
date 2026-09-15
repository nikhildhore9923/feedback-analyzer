# Sentiment Trends & Time-Based Analytics

## Goal
The goal of this feature is to help a business answer: "Is customer sentiment improving or getting worse over time?" 
It achieves this by grouping existing feedback data by date and calculating sentiment volumes.

## Data Source & DB Aggregation
The feature queries the existing `reviews` table. Instead of fetching all rows into memory (which would be catastrophic for performance on a large dataset), the data is aggregated directly in MySQL using `GROUP BY DATE(timestamp)`. 
We use conditional sums (`SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END)`) to count the volume of each sentiment per day.

## API Endpoint
`GET /api/analytics/trends?days=30`

**Parameters:**
- `days` (string): The number of days to look back. Accepted values: `7`, `30`, `90`, or `all`.

**Response Structure:**
```json
{
  "trends": [
    {
      "date": "2026-09-10T00:00:00.000Z",
      "positive": 12,
      "negative": 4,
      "neutral": 2,
      "total": 18
    }
  ],
  "previousStats": {
    "negativeRate": 22.5
  }
}
```

## Tenant Isolation
The API fully respects the Pulse multi-tenant architecture. The `tenantMiddleware` automatically injects `req.tenantId` from the `X-Tenant-ID` header. The SQL query strictly applies `WHERE tenant_id = ?` before any aggregation occurs.

## Frontend Implementation
The Dashboard has been upgraded to include:
1. **Time Range Filter**: A dropdown to select the analytics period.
2. **Dynamic KPI Cards**: The stat cards now reflect the *selected period* rather than global all-time stats.
3. **Sentiment Trends Line Chart**: Built with Recharts, displaying Positive, Negative, and Neutral lines over time.
4. **Feedback Volume Bar Chart**: A clean bar chart showing total feedback ingestion over time.
5. **Negative Rate Indicator**: Calculates the percentage of negative feedback in the selected period, and compares it to the previous equivalent period if data exists.

## Testing Performed
- Verified API responds correctly with `X-Tenant-ID` filtering.
- Handled empty states gracefully (if < 2 data points exist, a helpful message is displayed instead of a misleading single-dot chart).
- Catch block implemented on the new API call in `Dashboard.jsx` to ensure the entire page does not crash if the backend is temporarily unreachable or pending a deployment.

## DB Safety & Limitations
- Parameterized queries are used (`?`) to prevent SQL injection.
- Time range filtering is done at the DB level using `DATE_SUB(NOW(), INTERVAL ? DAY)`.
- No fake AI insights were generated. All data directly reflects the SQL aggregations.
