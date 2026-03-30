-- Limpiar datos existentes (útil para re-seed)
DELETE FROM services;
DELETE FROM promotions;

-- TRATAMIENTOS FACIALES
-- Higiene Facial
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Limpieza Esencial', 'Limpieza facial con exfoliación + espátula ultrasónica + mascarilla específica según biotipo cutáneo', 35000, 'facial', 10),
  ('Limpieza Profunda', 'Extracción de puntos negros + espátula ultrasónica + punta de diamantes + alta frecuencia + ácido', 39000, 'facial', 20),
  ('Higiene Premium', 'Ídem Limpieza Profunda + terapia fotolumínica roja + electroporación con activos para resultados más visibles', 45000, 'facial', 30);

-- Peeling Renovador
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Peeling Clásico', 'Peeling profesional para unificar tono, suavizar líneas y mejorar textura', 29000, 'facial', 40),
  ('Peeling con Ácido', 'Higiene Profunda + tratamiento con ácido', 39000, 'facial', 50),
  ('Peeling con Electroporación', 'Higiene Profunda + peeling + electroporación', 43000, 'facial', 60),
  ('Peeling con Retinoico', 'Higiene + mascarilla de retinoico para suavizar líneas, afinar poros y rejuvenecer', 47000, 'facial', 70);

-- Radiofrecuencia
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Radiofrecuencia Base', 'Calor dérmico que estimula colágeno y elastina. Incluye Higiene Profunda + radiofrecuencia', 39000, 'facial', 80),
  ('Radiofrecuencia con Electroporador', 'Higiene Profunda + radiofrecuencia + electroporador', 43000, 'facial', 90);

-- Ritual
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Ritual Piel de Porcelana', 'Radiofrecuencia tensora + cristales de vitamina C + ácido renovador. Piel firme, luminosa y uniforme desde la primera sesión', 45000, 'facial', 100);

-- Dermaplaning
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Dermaplaning Clásico', 'Peeling con bisturí + activos específicos. Cada 25/28 días', 35000, 'facial', 110),
  ('Dermaplaning con Electroporación', 'Higiene Profunda + Dermaplaning + electroporación y/o ácido', 39000, 'facial', 120),
  ('Dermaplaning Completo', 'Dermaplaning + Peeling con ácidos (manchas, poros dilatados) + electroporación. Suavidad extrema, glow inmediato', 45000, 'facial', 130);

-- Microneedling / Dermapen
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Dermapen Base', 'Higiene Profunda + Dermapen. Estimula colágeno y elastina mediante microagujas', 39000, 'facial', 140),
  ('Dermapen con Peeling', 'Higiene Profunda + peeling + Dermapen', 45000, 'facial', 150),
  ('Meso Botox Cosmetológico', 'Microneedling + activos específicos + electroporación', 43000, 'facial', 160),
  ('Ritual Antiage Avanzado', 'Exosomas con efecto lifting y firmeza', 49000, 'facial', 170);

-- Add-on
INSERT INTO services (name, description, price, price_label, category, sort_order) VALUES
  ('Terapia LED Roja (Add-on)', 'Fotobiomoduladora. Optimiza recuperación cutánea y prolonga resultados. Se suma a cualquier tratamiento facial', 5900, '+$5.900', 'facial', 180);

-- TRATAMIENTOS CORPORALES
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Tratamiento Corporal — 1 sesión', 'Indicado para abdomen, celulitis, piernas cansadas y flacidez. Combina Ondas de Choque, Crio-Radiofrecuencia, Presoterapia y/o Maderoterapia según el caso. Incluye exfoliación + activos + cremas específicas', 31000, 'corporal', 10),
  ('Tratamiento Corporal — Pack 3 sesiones', 'Pack de 3 sesiones de tratamiento corporal. Los packs deben consumirse dentro de un mes', 80000, 'corporal', 20),
  ('Tratamiento Corporal — Pack 4 sesiones', 'Pack de 4 sesiones de tratamiento corporal. Los packs deben consumirse dentro de un mes', 95000, 'corporal', 30),
  ('Reflexología', 'Sesión de reflexología', 15000, 'corporal', 40),
  ('Masaje Relajante de Espalda', 'Masaje relajante focalizado en espalda', 25000, 'corporal', 50),
  ('Masaje Relajante Cuerpo Completo', 'Masaje relajante de cuerpo completo', 39000, 'corporal', 60),
  ('Bronceado Orgánico Made in EE.UU', 'Color dorado y duradero. 100% natural y libre de químicos. Producto importado, resultados inmediatos', 37000, 'corporal', 70);

-- SERVICIOS (Karina Ruiz Diaz)
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Perfilado de cejas', 'Diseño personalizado de cejas', 25000, 'servicios', 10),
  ('Perfilado y sombreado de cejas', 'Diseño personalizado + sombreado para realzar el color y definir la mirada', 29000, 'servicios', 20),
  ('Perfilado, sombreado y alisado de cejas', 'Diseño completo con alisado para emprolijar', 35000, 'servicios', 30),
  ('Lifting de pestañas', 'Eleva y curva las pestañas naturales sin extensiones artificiales. Resalta la mirada con bajo mantenimiento', 33000, 'servicios', 40),
  ('Makeup profesional en el local', 'Maquillaje profesional. Técnica, precisión y estilo. Maquillaje personalizado', 65000, 'servicios', 50),
  ('Limpieza de cutis', 'Limpieza de cutis profesional', 35000, 'servicios', 60),
  ('Esmaltado Tradicional Manos', 'Esmaltado tradicional para manos', 15000, 'servicios', 70),
  ('Esmaltado Tradicional Pies', 'Esmaltado tradicional para pies', 17000, 'servicios', 80),
  ('Esmaltado Semipermanente Manos', 'Esmaltado semipermanente para manos', 21000, 'servicios', 90),
  ('Esmaltado Semipermanente Pies', 'Esmaltado semipermanente para pies', 23000, 'servicios', 100),
  ('Promo Manos + Pies Semipermanente', 'Combo esmaltado semipermanente manos y pies', 35000, 'servicios', 110),
  ('Promo Manos + Pies Tradicional', 'Combo esmaltado tradicional manos y pies', 25000, 'servicios', 120),
  ('Kapping + Semipermanente', 'Kapping más esmaltado semipermanente', 25000, 'servicios', 130),
  ('Diseño (adicional)', 'Adicional por diseño en uñas', 3000, 'servicios', 140),
  ('Retiro de Semipermanente', 'Retiro de esmaltado semipermanente', 9000, 'servicios', 150);
