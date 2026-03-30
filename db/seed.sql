-- Limpiar datos existentes (útil para re-seed)
DELETE FROM services;
DELETE FROM promotions;

-- SERVICIOS DE ANALÍA (Piel, Cejas y Pestañas)
INSERT INTO services (name, description, price, price_label, category, sort_order) VALUES
  ('Higiene Facial Profesional', 'Higiene esencial, profunda o premium según cada biotipo cutáneo.', 35000, 'desde $35.000', 'analia', 10),
  ('Peeling Renovador', 'Unifica tono, suaviza líneas y mejora la textura de la piel.', 29000, 'desde $29.000', 'analia', 20),
  ('Radiofrecuencia', 'Tratamiento tensor que estimula colágeno y elastina.', 39000, 'desde $39.000', 'analia', 30),
  ('Ritual Piel de Porcelana', 'Radiofrecuencia + Vitamina C + Ácido renovador para un glow inmediato.', 45000, '$45.000', 'analia', 40),
  ('Dermaplaning', 'Peeling con bisturí para una suavidad y luminosidad extrema.', 35000, 'desde $35.000', 'analia', 50),
  ('Microneedling / Dermapen', 'Rejuvenecimiento profundo para firmeza y renovación celular.', 39000, 'desde $39.000', 'analia', 60),
  ('Tratamientos Corporales', 'Reductores, reafirmantes y modeladores (abdomen, celulitis, flacidez).', 31000, 'desde $31.000', 'analia', 70),
  ('Bronceado Orgánico', 'Color dorado natural, libre de químicos y resultados inmediatos.', 37000, '$37.000', 'analia', 80),
  ('Maquillaje Profesional', 'Makeup social y para eventos con las mejores técnicas.', 65000, '$65.000', 'analia', 100);

-- SERVICIOS DE KARINA (Uñas y Masajes)
INSERT INTO services (name, description, price, price_label, category, sort_order) VALUES
  ('Manicura', 'Esmaltado tradicional y semipermanente para manos.', 15000, 'desde $15.000', 'karina', 10),
  ('Estética de pies', 'Cuidado y embellecimiento de los pies, incluye pedicura.', 15000, 'desde $15.000', 'karina', 20),
  ('Masajes relajantes', 'Reflexología y masajes de espalda o cuerpo completo.', 15000, 'desde $15.000', 'karina', 30);

-- PROMOCIONES DE EJEMPLO
INSERT INTO promotions (title, description, original_price, promo_price, active) VALUES
  ('Ritual Piel de Porcelana + LED', 'Glow inmediato con terapia fotolumínica de regalo.', 50900, 45000, 1),
  ('Promo Manos + Pies Semipermanente', 'Lucí tus manos y pies perfectos con este combo.', 44000, 35000, 1);
