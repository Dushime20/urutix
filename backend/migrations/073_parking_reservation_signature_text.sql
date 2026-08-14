-- Expand handwritten signature storage from a typed name to a drawn image.
ALTER TABLE parking_reservations
  ALTER COLUMN signature TYPE TEXT;
