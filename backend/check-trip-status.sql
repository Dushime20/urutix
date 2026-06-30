-- Check trip created for the accepted bid on load 27d087a3-b5b0-471a-bf97-326bf59fed05
SELECT
  t.id,
  t."tripNumber",
  t.status,
  t."actualStartTime",
  t."plannedStartTime",
  t."createdAt",
  t."agreedPrice",
  l.title AS load_title
FROM trips t
JOIN loads l ON l.id = t."loadId"
WHERE t."loadId" = '27d087a3-b5b0-471a-bf97-326bf59fed05';
