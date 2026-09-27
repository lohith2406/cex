-- @param {Int} $1:bucketSeconds
-- @param {String} $2:market
-- @param {DateTime} $3:start
-- @param {DateTime} $4:end
SELECT
  to_timestamp(floor(extract(epoch FROM "createdAt") / $1::int) * $1::int) AS bucket,
  (array_agg(price ORDER BY "createdAt" ASC))[1]  AS open,
  max(price)                                      AS high,
  min(price)                                      AS low,
  (array_agg(price ORDER BY "createdAt" DESC))[1] AS close,
  sum(qty)::double precision                      AS volume
FROM "Fill"
WHERE market = $2::"Market"
  AND "createdAt" >= $3
  AND "createdAt" <  $4
GROUP BY bucket
ORDER BY bucket ASC
