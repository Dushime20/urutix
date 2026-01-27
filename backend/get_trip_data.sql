-- SQL Script to get trip data
-- This script joins trips with loads and drivers to provide a comprehensive view

SELECT
    t.id AS "Trip ID",
    t."tripNumber" AS "Trip Number",
    t.status AS "Trip Status",
    t."plannedStartTime" AS "Planned Start",
    t."plannedEndTime" AS "Planned End",
    t."actualStartTime" AS "Actual Start",
    t."actualEndTime" AS "Actual End",
    t."agreedPrice" AS "Agreed Price",
    t."totalCost" AS "Total Cost",
    
    -- Load Details
    l.title AS "Load Title",
    l.reference AS "Load Reference",
    l.status AS "Load Status",
    l."weight" AS "Weight",
    l."loadValue" AS "Load Value",
    
    -- Driver Details
    d."firstName" AS "Driver First Name",
    d."lastName" AS "Driver Last Name",
    d."licenseNumber" AS "License Number",
    d.phone AS "Driver Phone",
    
    -- Tenant ID (Good for filtering if needed)
    t."tenantId"
FROM
    trips t
LEFT JOIN
    loads l ON t."loadId" = l.id
LEFT JOIN
    drivers d ON t."driverId" = d.id
ORDER BY
    t."createdAt" DESC;
